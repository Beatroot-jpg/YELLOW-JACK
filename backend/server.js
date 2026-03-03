const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
require('dotenv').config();

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

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'yellow-jack-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Register new user (Admin only - or first user)
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    // Check if this is the first user (auto-admin)
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;

    const userRole = isFirstUser ? 'Admin' : (role || 'Staff');

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

    // Create session
    req.session.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    };

    res.json({
      message: 'Login successful',
      user: req.session.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check if user is authenticated
app.get('/auth/check', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get current user
app.get('/auth/user', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Yellow Jack API is running' });
});

// ============================================
// SALES ENDPOINTS
// ============================================

// Get all sales (with pagination)
app.get('/api/sales', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM sales ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM sales');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      sales: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Create new sale
app.post('/api/sales', requireAuth, async (req, res) => {
  try {
    const { employee_name, description, total_amount } = req.body;

    // Calculate 10% and 90% split
    const money_earnt = parseFloat(total_amount) * 0.10;
    const business_made = parseFloat(total_amount) * 0.90;

    // Insert sale
    const result = await pool.query(
      `INSERT INTO sales (employee_name, description, total_amount, money_earnt, business_made)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employee_name, description, total_amount, money_earnt, business_made]
    );

    // Update employee ledger
    await pool.query(
      `INSERT INTO employee_ledger (employee_name, total_money_earnt, deals_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (employee_name)
       DO UPDATE SET
         total_money_earnt = employee_ledger.total_money_earnt + $2,
         deals_count = employee_ledger.deals_count + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [employee_name, money_earnt]
    );

    res.json({
      message: 'Sale created successfully',
      sale: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// Delete sale (Manager/Admin only)
app.delete('/api/sales/:id', requireRole(['Manager', 'Admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get sale details before deleting
    const saleResult = await pool.query('SELECT * FROM sales WHERE id = $1', [id]);
    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = saleResult.rows[0];

    // Delete sale
    await pool.query('DELETE FROM sales WHERE id = $1', [id]);

    // Update ledger (subtract the money_earnt)
    await pool.query(
      `UPDATE employee_ledger
       SET total_money_earnt = total_money_earnt - $1,
           deals_count = deals_count - 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE employee_name = $2`,
      [sale.money_earnt, sale.employee_name]
    );

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
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

// Pay employee (Manager/Admin only)
app.post('/api/ledger/pay', requireRole(['Manager', 'Admin']), async (req, res) => {
  try {
    const { employee_name, amount } = req.body;
    const paid_by = req.session.user.username;

    // Record payment
    await pool.query(
      'INSERT INTO payment_history (employee_name, amount_paid, paid_by) VALUES ($1, $2, $3)',
      [employee_name, amount, paid_by]
    );

    // Update ledger
    await pool.query(
      `UPDATE employee_ledger
       SET total_money_earnt = total_money_earnt - $1,
           last_payment_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE employee_name = $2`,
      [amount, employee_name]
    );

    res.json({ message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// ============================================
// ROSTER ENDPOINTS
// ============================================

// Get all roster members
app.get('/api/roster', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM roster ORDER BY date_joined DESC'
    );
    res.json({ roster: result.rows });
  } catch (error) {
    console.error('Error fetching roster:', error);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// Add roster member (Manager/Admin only)
app.post('/api/roster', requireRole(['Manager', 'Admin']), async (req, res) => {
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
app.put('/api/roster/:id', requireRole(['Manager', 'Admin']), async (req, res) => {
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
app.delete('/api/roster/:id', requireRole(['Manager', 'Admin']), async (req, res) => {
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
app.post('/api/blacklist', requireRole(['Manager', 'Admin']), async (req, res) => {
  try {
    const { name, reason } = req.body;
    const added_by = req.session.user.username;

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
app.delete('/api/blacklist/:id', requireRole(['Manager', 'Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM blacklist WHERE id = $1', [id]);
    res.json({ message: 'Removed from blacklist successfully' });
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    res.status(500).json({ error: 'Failed to remove from blacklist' });
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

