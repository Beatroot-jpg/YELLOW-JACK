const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'yellow-jack-jwt-secret-key';
const ADMIN_ROLES = ['Admin', 'Owner'];
const USER_ROLES = ['Staff', 'Manager', 'Admin', 'Owner'];

const { pool, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'https://yellowjak.netlify.app',
  'http://localhost:8080',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT Authentication middleware
function verifyAuthHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = verifyAuthHeader(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = user;
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    const user = verifyAuthHeader(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = user;
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

function toMoney(value) {
  return Number(Number(value).toFixed(2));
}

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

function normalizeReason(rawReason, required = false) {
  const reason = String(rawReason || '').trim();
  if (!reason) {
    return required ? { error: 'Change reason is required' } : { value: null };
  }
  return { value: reason };
}

function parseSaleInput(body) {
  const employee_name = String(body.employee_name || '').trim();
  const description = String(body.description || '').trim();
  const total = Number(body.total_amount);

  if (!employee_name) {
    return { error: 'Employee name is required' };
  }

  if (!Number.isFinite(total) || total <= 0) {
    return { error: 'Total amount must be greater than 0' };
  }

  const total_amount = toMoney(total);
  return {
    employee_name,
    description,
    total_amount,
    money_earnt: toMoney(total_amount * 0.10),
    business_made: toMoney(total_amount * 0.90)
  };
}

async function reconcileLedgerForEmployee(client, employeeName) {
  const name = String(employeeName || '').trim();
  if (!name) return;

  const [salesAgg, paymentAgg] = await Promise.all([
    client.query(
      `SELECT COALESCE(SUM(money_earnt), 0) AS commission_total, COUNT(*) AS deals_count
       FROM sales WHERE employee_name = $1 AND deleted_at IS NULL`,
      [name]
    ),
    client.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS amount_paid, MAX(paid_at) AS last_payment_date
       FROM payment_history WHERE employee_name = $1`,
      [name]
    )
  ]);

  const commissionTotal = Number(salesAgg.rows[0].commission_total || 0);
  const dealsCount = parseInt(salesAgg.rows[0].deals_count || 0);
  const amountPaid = Number(paymentAgg.rows[0].amount_paid || 0);
  const lastPaymentDate = paymentAgg.rows[0].last_payment_date || null;

  if (dealsCount === 0 && amountPaid === 0) {
    await client.query('DELETE FROM employee_ledger WHERE employee_name = $1', [name]);
    return;
  }

  await client.query(
    `INSERT INTO employee_ledger (employee_name, total_money_earnt, deals_count, last_payment_date, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (employee_name)
     DO UPDATE SET
       total_money_earnt = EXCLUDED.total_money_earnt,
       deals_count = EXCLUDED.deals_count,
       last_payment_date = EXCLUDED.last_payment_date,
       updated_at = CURRENT_TIMESTAMP`,
    [name, toMoney(commissionTotal - amountPaid), dealsCount, lastPaymentDate]
  );
}

async function reconcileLedgerForEmployees(client, employeeNames) {
  const uniqueNames = [...new Set((employeeNames || []).map(name => String(name || '').trim()).filter(Boolean))];
  for (const name of uniqueNames) {
    await reconcileLedgerForEmployee(client, name);
  }
}

function buildSaleAuditState(sale) {
  if (!sale) return null;
  return {
    id: sale.id,
    employee_name: sale.employee_name,
    description: sale.description || '',
    total_amount: Number(sale.total_amount || 0),
    money_earnt: Number(sale.money_earnt || 0),
    business_made: Number(sale.business_made || 0),
    created_at: sale.created_at,
    updated_at: sale.updated_at,
    created_by: sale.created_by || null,
    updated_by: sale.updated_by || null,
    deleted_at: sale.deleted_at || null,
    deleted_by: sale.deleted_by || null,
    deleted_reason: sale.deleted_reason || null
  };
}

async function recordSaleRevision(client, { saleId, action, changedBy, reason = null, beforeState = null, afterState = null }) {
  await client.query(
    `INSERT INTO sale_revisions (sale_id, action, changed_by, change_reason, before_state, after_state)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
    [
      saleId,
      action,
      changedBy,
      reason,
      beforeState ? JSON.stringify(beforeState) : null,
      afterState ? JSON.stringify(afterState) : null
    ]
  );
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Register new user (Admin/Owner only - or first user)
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    // Check if this is the first user (auto-admin)
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;

    if (!isFirstUser) {
      const requester = verifyAuthHeader(req.headers.authorization);
      if (!requester) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!isAdminRole(requester.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const requestedRole = role || (isFirstUser ? 'Owner' : 'Staff');
    if (!USER_ROLES.includes(requestedRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${USER_ROLES.join(', ')}` });
    }

    const userRole = requestedRole;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role',
      [username, password_hash, full_name, userRole]
    );

    res.json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Sign JWT token
    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout (client just discards the token)
app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Check if token is valid
app.get('/auth/check', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }
  try {
    const user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    res.json({ authenticated: true, user });
  } catch {
    res.json({ authenticated: false });
  }
});

// Get current user
app.get('/auth/user', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Yellow Jack API is running' });
});

// ============================================
// SALES ENDPOINTS
// ============================================

// Get all sales with pagination + optional filtering by employee, date range, and status
app.get('/api/sales', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { employee, date_from, date_to } = req.query;
    const status = String(req.query.status || 'active').toLowerCase();

    const conditions = [];
    const params = [];

    if (!['active', 'deleted', 'all'].includes(status)) {
      return res.status(400).json({ error: 'Invalid sales status filter' });
    }

    if ((status === 'deleted' || status === 'all') && !isAdminRole(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (status === 'active') {
      conditions.push('deleted_at IS NULL');
    } else if (status === 'deleted') {
      conditions.push('deleted_at IS NOT NULL');
    }

    if (employee) {
      params.push(`%${employee}%`);
      conditions.push(`employee_name ILIKE $${params.length}`);
    }
    if (date_from) {
      params.push(date_from);
      conditions.push(`DATE(created_at) >= $${params.length}`);
    }
    if (date_to) {
      params.push(date_to);
      conditions.push(`DATE(created_at) <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [salesResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM sales ${where} ORDER BY COALESCE(deleted_at, created_at) DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM sales ${where}`, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    res.json({
      sales: salesResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Create new sale
app.post('/api/sales', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const parsed = parseSaleInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }
    const reason = normalizeReason(req.body.change_reason, false).value || 'Initial creation';

    await client.query('BEGIN');

    // Insert sale
    const result = await client.query(
      `INSERT INTO sales (employee_name, description, total_amount, money_earnt, business_made, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
      [parsed.employee_name, parsed.description, parsed.total_amount, parsed.money_earnt, parsed.business_made, req.user.username]
    );

    await recordSaleRevision(client, {
      saleId: result.rows[0].id,
      action: 'CREATE',
      changedBy: req.user.username,
      reason,
      afterState: buildSaleAuditState(result.rows[0])
    });

    await reconcileLedgerForEmployee(client, parsed.employee_name);
    await client.query('COMMIT');

    res.json({
      message: 'Sale created successfully',
      sale: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  } finally {
    client.release();
  }
});

// Update sale (Admin/Owner only)
app.put('/api/sales/:id', requireRole(ADMIN_ROLES), async (req, res) => {
  const client = await pool.connect();
  try {
    const parsed = parseSaleInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }
    const reasonCheck = normalizeReason(req.body.change_reason, true);
    if (reasonCheck.error) {
      return res.status(400).json({ error: reasonCheck.error });
    }

    await client.query('BEGIN');

    const currentResult = await client.query('SELECT * FROM sales WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!currentResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sale not found' });
    }

    const currentSale = currentResult.rows[0];
    if (currentSale.deleted_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Deleted sales must be restored before editing' });
    }

    const updatedResult = await client.query(
      `UPDATE sales
       SET employee_name = $1,
           description = $2,
           total_amount = $3,
           money_earnt = $4,
           business_made = $5,
           updated_by = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [parsed.employee_name, parsed.description, parsed.total_amount, parsed.money_earnt, parsed.business_made, req.user.username, req.params.id]
    );

    await recordSaleRevision(client, {
      saleId: currentSale.id,
      action: 'UPDATE',
      changedBy: req.user.username,
      reason: reasonCheck.value,
      beforeState: buildSaleAuditState(currentSale),
      afterState: buildSaleAuditState(updatedResult.rows[0])
    });

    await reconcileLedgerForEmployees(client, [currentSale.employee_name, parsed.employee_name]);
    await client.query('COMMIT');

    res.json({
      message: 'Sale updated successfully',
      sale: updatedResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating sale:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  } finally {
    client.release();
  }
});

// Soft delete sale (Admin/Owner only)
app.delete('/api/sales/:id', requireRole(ADMIN_ROLES), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const reasonCheck = normalizeReason(req.body?.change_reason, true);
    if (reasonCheck.error) {
      return res.status(400).json({ error: reasonCheck.error });
    }

    await client.query('BEGIN');

    // Get sale details before deleting
    const saleResult = await client.query('SELECT * FROM sales WHERE id = $1 FOR UPDATE', [id]);
    if (saleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = saleResult.rows[0];
    if (sale.deleted_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sale is already archived' });
    }

    const deletedResult = await client.query(
      `UPDATE sales
       SET deleted_at = CURRENT_TIMESTAMP,
           deleted_by = $1,
           deleted_reason = $2,
           updated_by = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [req.user.username, reasonCheck.value, id]
    );

    await recordSaleRevision(client, {
      saleId: sale.id,
      action: 'DELETE',
      changedBy: req.user.username,
      reason: reasonCheck.value,
      beforeState: buildSaleAuditState(sale),
      afterState: buildSaleAuditState(deletedResult.rows[0])
    });

    await reconcileLedgerForEmployee(client, sale.employee_name);
    await client.query('COMMIT');

    res.json({ message: 'Sale archived successfully', sale: deletedResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  } finally {
    client.release();
  }
});

app.post('/api/sales/:id/restore', requireRole(ADMIN_ROLES), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const reasonCheck = normalizeReason(req.body?.change_reason, true);
    if (reasonCheck.error) {
      return res.status(400).json({ error: reasonCheck.error });
    }

    await client.query('BEGIN');

    const saleResult = await client.query('SELECT * FROM sales WHERE id = $1 FOR UPDATE', [id]);
    if (!saleResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = saleResult.rows[0];
    if (!sale.deleted_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sale is already active' });
    }

    const restoredResult = await client.query(
      `UPDATE sales
       SET deleted_at = NULL,
           deleted_by = NULL,
           deleted_reason = NULL,
           updated_by = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user.username, id]
    );

    await recordSaleRevision(client, {
      saleId: sale.id,
      action: 'RESTORE',
      changedBy: req.user.username,
      reason: reasonCheck.value,
      beforeState: buildSaleAuditState(sale),
      afterState: buildSaleAuditState(restoredResult.rows[0])
    });

    await reconcileLedgerForEmployee(client, sale.employee_name);
    await client.query('COMMIT');

    res.json({ message: 'Sale restored successfully', sale: restoredResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error restoring sale:', error);
    res.status(500).json({ error: 'Failed to restore sale' });
  } finally {
    client.release();
  }
});

app.get('/api/sales/:id/history', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, sale_id, action, changed_by, change_reason, before_state, after_state, changed_at
       FROM sale_revisions
       WHERE sale_id = $1
       ORDER BY changed_at DESC, id DESC`,
      [req.params.id]
    );

    res.json({ history: result.rows });
  } catch (error) {
    console.error('Error loading sale history:', error);
    res.status(500).json({ error: 'Failed to load sale history' });
  }
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

// Summary stats - today, weekly, monthly, all-time, top earners
app.get('/api/analytics/summary', requireAuth, async (req, res) => {
  try {
    const [today, weekly, monthly, allTime, topEarners, salesCount] = await Promise.all([
      // Today's sales
      pool.query(`
        SELECT COALESCE(SUM(total_amount),0) AS total, COALESCE(SUM(business_made),0) AS business, COUNT(*) AS count
        FROM sales WHERE deleted_at IS NULL AND DATE(created_at) = CURRENT_DATE
      `),
      // This week's sales
      pool.query(`
        SELECT COALESCE(SUM(total_amount),0) AS total, COALESCE(SUM(business_made),0) AS business, COUNT(*) AS count
        FROM sales WHERE deleted_at IS NULL AND created_at >= date_trunc('week', CURRENT_TIMESTAMP)
      `),
      // This month's sales
      pool.query(`
        SELECT COALESCE(SUM(total_amount),0) AS total, COALESCE(SUM(business_made),0) AS business, COUNT(*) AS count
        FROM sales WHERE deleted_at IS NULL AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
      `),
      // All-time totals
      pool.query(`
        SELECT COALESCE(SUM(total_amount),0) AS total, COALESCE(SUM(business_made),0) AS business,
               COALESCE(SUM(money_earnt),0) AS staff_earnt, COUNT(*) AS count
        FROM sales WHERE deleted_at IS NULL
      `),
      // Top 5 earners (all-time)
      pool.query(`
        SELECT employee_name, COALESCE(SUM(money_earnt), 0) AS total_money_earnt, COUNT(*) AS deals_count
        FROM sales WHERE deleted_at IS NULL
        GROUP BY employee_name
        ORDER BY total_money_earnt DESC, deals_count DESC
        LIMIT 5
      `),
      // Active staff count
      pool.query(`SELECT COUNT(*) AS count FROM employee_ledger`)
    ]);

    res.json({
      today: today.rows[0],
      weekly: weekly.rows[0],
      monthly: monthly.rows[0],
      all_time: allTime.rows[0],
      top_earners: topEarners.rows,
      active_staff: parseInt(salesCount.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

// ============================================
// LEDGER ENDPOINTS
// ============================================

// Get employee ledger
app.get('/api/ledger', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employee_ledger ORDER BY total_money_earnt DESC'
    );
    res.json({ ledger: result.rows });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

// Pay employee (Manager/Admin/Owner)
app.post('/api/ledger/pay', requireRole(['Manager', 'Admin', 'Owner']), async (req, res) => {
  const client = await pool.connect();
  try {
    const { employee_name, amount } = req.body;
    const paid_by = req.user.username;
    const paymentAmount = Number(amount);

    if (!String(employee_name || '').trim()) {
      return res.status(400).json({ error: 'Employee name is required' });
    }

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    await client.query('BEGIN');

    // Record payment
    await client.query(
      'INSERT INTO payment_history (employee_name, amount_paid, paid_by) VALUES ($1, $2, $3)',
      [String(employee_name).trim(), paymentAmount, paid_by]
    );

    await reconcileLedgerForEmployee(client, String(employee_name).trim());
    await client.query('COMMIT');

    res.json({ message: 'Payment recorded successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  } finally {
    client.release();
  }
});

// ============================================
// ROSTER ENDPOINTS
// ============================================

// Get all roster members
app.get('/api/roster', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT *, name AS full_name FROM roster ORDER BY date_joined DESC'
    );
    res.json({ roster: result.rows });
  } catch (error) {
    console.error('Error fetching roster:', error);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// Add roster member (Manager/Admin only)
app.post('/api/roster', requireRole(['Manager', 'Admin', 'Owner']), async (req, res) => {
  try {
    const { name, rank, date_joined, status } = req.body;

    const result = await pool.query(
      `INSERT INTO roster (name, rank, date_joined, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, rank, date_joined || new Date(), status || 'Active']
    );

    res.json({
      message: 'Roster member added successfully',
      member: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding roster member:', error);
    res.status(500).json({ error: 'Failed to add roster member' });
  }
});

// Update roster member (Manager/Admin only)
app.put('/api/roster/:id', requireRole(['Manager', 'Admin', 'Owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rank, status } = req.body;

    const result = await pool.query(
      `UPDATE roster
       SET name = COALESCE($1, name),
           rank = COALESCE($2, rank),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, rank, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Roster member not found' });
    }

    res.json({
      message: 'Roster member updated successfully',
      member: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating roster member:', error);
    res.status(500).json({ error: 'Failed to update roster member' });
  }
});

// Delete roster member (Manager/Admin only)
app.delete('/api/roster/:id', requireRole(['Manager', 'Admin', 'Owner']), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM roster WHERE id = $1', [id]);
    res.json({ message: 'Roster member deleted successfully' });
  } catch (error) {
    console.error('Error deleting roster member:', error);
    res.status(500).json({ error: 'Failed to delete roster member' });
  }
});

// ============================================
// BLACKLIST ENDPOINTS
// ============================================

// Get blacklist
app.get('/api/blacklist', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blacklist ORDER BY added_at DESC'
    );
    res.json({ blacklist: result.rows });
  } catch (error) {
    console.error('Error fetching blacklist:', error);
    res.status(500).json({ error: 'Failed to fetch blacklist' });
  }
});

// Add to blacklist (Manager/Admin only)
app.post('/api/blacklist', requireRole(['Manager', 'Admin', 'Owner']), async (req, res) => {
  try {
    const { name, reason } = req.body;
    const added_by = req.user.username;

    const result = await pool.query(
      'INSERT INTO blacklist (name, reason, added_by) VALUES ($1, $2, $3) RETURNING *',
      [name, reason, added_by]
    );

    res.json({
      message: 'Added to blacklist successfully',
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    res.status(500).json({ error: 'Failed to add to blacklist' });
  }
});

// Remove from blacklist (Manager/Admin only)
app.delete('/api/blacklist/:id', requireRole(['Manager', 'Admin', 'Owner']), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM blacklist WHERE id = $1', [id]);
    res.json({ message: 'Removed from blacklist successfully' });
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    res.status(500).json({ error: 'Failed to remove from blacklist' });
  }
});

// Get individual employee ledger + their sales history
app.get('/api/ledger/:employee_name', requireAuth, async (req, res) => {
  try {
    const { employee_name } = req.params;
    const [ledger, sales, payments] = await Promise.all([
      pool.query('SELECT * FROM employee_ledger WHERE employee_name ILIKE $1', [employee_name]),
      pool.query('SELECT * FROM sales WHERE employee_name ILIKE $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20', [employee_name]),
      pool.query('SELECT * FROM payment_history WHERE employee_name ILIKE $1 ORDER BY paid_at DESC LIMIT 20', [employee_name])
    ]);

    if (!ledger.rows.length) return res.status(404).json({ error: 'Employee not found in ledger' });
    res.json({ ledger: ledger.rows[0], sales: sales.rows, payments: payments.rows });
  } catch (error) {
    console.error('Error fetching employee ledger:', error);
    res.status(500).json({ error: 'Failed to fetch employee ledger' });
  }
});

// ============================================
// PAYMENT HISTORY ENDPOINTS
// ============================================

// Get payment history
app.get('/api/payments', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_history ORDER BY paid_at DESC LIMIT 50'
    );
    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// ============================================
// TIMESHEET ENDPOINTS
// ============================================

// Get all currently clocked-in employees (no clock_out yet)
app.get('/api/timesheets/active', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM timesheets WHERE clock_out IS NULL ORDER BY clock_in ASC`
    );
    res.json({ active: result.rows });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// Get weekly summary - total hours per employee per week
app.get('/api/timesheets/weekly', requireAuth, async (req, res) => {
  try {
    const { week_start } = req.query;

    // Default to current week if not specified
    const weekFilter = week_start
      ? `DATE(week_start) = $1`
      : `week_start >= date_trunc('week', CURRENT_DATE)`;
    const params = week_start ? [week_start] : [];

    const [summary, weeks] = await Promise.all([
      pool.query(
        `SELECT
          employee_name,
          week_start,
          COUNT(*) AS shifts,
          SUM(duration_minutes) AS total_minutes,
          ROUND(SUM(duration_minutes) / 60.0, 2) AS total_hours
         FROM timesheets
         WHERE clock_out IS NOT NULL AND ${weekFilter}
         GROUP BY employee_name, week_start
         ORDER BY week_start DESC, total_minutes DESC`,
        params
      ),
      // Get list of available weeks for the picker
      pool.query(
        `SELECT DISTINCT week_start FROM timesheets
         WHERE clock_out IS NOT NULL AND week_start IS NOT NULL
         ORDER BY week_start DESC LIMIT 12`
      )
    ]);

    res.json({ summary: summary.rows, available_weeks: weeks.rows });
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    res.status(500).json({ error: 'Failed to fetch weekly summary' });
  }
});

// Get all timesheet entries (paginated)
app.get('/api/timesheets', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { employee } = req.query;

    const params = [];
    const where = employee
      ? `WHERE employee_name ILIKE $${params.push(`%${employee}%`)}`
      : '';

    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT * FROM timesheets ${where} ORDER BY clock_in DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM timesheets ${where}`, params)
    ]);

    res.json({
      timesheets: rows.rows,
      pagination: { page, limit, total: parseInt(count.rows[0].count), pages: Math.ceil(count.rows[0].count / limit) }
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

// Clock In
app.post('/api/timesheets/clock-in', requireAuth, async (req, res) => {
  try {
    const { employee_name } = req.body;
    if (!employee_name) return res.status(400).json({ error: 'Employee name is required' });

    // Check if already clocked in
    const existing = await pool.query(
      `SELECT id FROM timesheets WHERE employee_name ILIKE $1 AND clock_out IS NULL`,
      [employee_name]
    );
    if (existing.rows.length) {
      return res.status(400).json({ error: `${employee_name} is already clocked in` });
    }

    // Calculate week start (Monday)
    const weekStart = await pool.query(
      `SELECT date_trunc('week', CURRENT_DATE)::DATE AS week_start`
    );

    const result = await pool.query(
      `INSERT INTO timesheets (employee_name, clock_in, week_start)
       VALUES ($1, NOW(), $2) RETURNING *`,
      [employee_name, weekStart.rows[0].week_start]
    );

    res.json({ message: `${employee_name} clocked in`, timesheet: result.rows[0] });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock Out
app.post('/api/timesheets/clock-out', requireAuth, async (req, res) => {
  try {
    const { employee_name, notes } = req.body;
    if (!employee_name) return res.status(400).json({ error: 'Employee name is required' });

    // Find the open entry
    const open = await pool.query(
      `SELECT * FROM timesheets WHERE employee_name ILIKE $1 AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1`,
      [employee_name]
    );
    if (!open.rows.length) {
      return res.status(400).json({ error: `${employee_name} is not clocked in` });
    }

    const entry = open.rows[0];
    const result = await pool.query(
      `UPDATE timesheets
       SET clock_out = NOW(),
           duration_minutes = ROUND(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 60),
           notes = $1
       WHERE id = $2
       RETURNING *`,
      [notes || null, entry.id]
    );

    const ts = result.rows[0];
    const hours = Math.floor(ts.duration_minutes / 60);
    const mins = ts.duration_minutes % 60;

    res.json({
      message: `${employee_name} clocked out — ${hours}h ${mins}m`,
      timesheet: ts
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

// ============================================
// USER MANAGEMENT ENDPOINTS (Admin/Owner only)
// ============================================

// Get all users
app.get('/api/users', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at ASC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
app.put('/api/users/:id', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, full_name } = req.body;
    const validRoles = USER_ROLES;

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE users SET
        role = COALESCE($1, role),
        full_name = COALESCE($2, full_name)
       WHERE id = $3 RETURNING id, username, full_name, role`,
      [role || null, full_name || null, id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User updated', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
app.delete('/api/users/:id', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// START SERVER
// ============================================

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Yellow Jack API server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server is listening on 0.0.0.0:${PORT}`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

