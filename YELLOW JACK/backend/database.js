const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing database schema...');

    // 1. Users table - username/password authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'Staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (role IN ('Staff', 'Manager', 'Admin'))
      )
    `);

    // 2. Roster table - staff members
    await client.query(`
      CREATE TABLE IF NOT EXISTS roster (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rank VARCHAR(100),
        date_joined DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (status IN ('Active', 'Inactive', 'On Leave'))
      )
    `);

    // 3. Sales/Deals table - sales transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        description TEXT,
        total_amount DECIMAL(10, 2) NOT NULL,
        money_earnt DECIMAL(10, 2) NOT NULL,
        business_made DECIMAL(10, 2) NOT NULL,
        sale_date DATE DEFAULT CURRENT_DATE,
        sale_time TIME DEFAULT CURRENT_TIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Employee ledger - commission tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_ledger (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) UNIQUE NOT NULL,
        total_money_earnt DECIMAL(10, 2) DEFAULT 0,
        deals_count INTEGER DEFAULT 0,
        last_payment_date TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Payment history - when staff get paid
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        amount_paid DECIMAL(10, 2) NOT NULL,
        paid_by VARCHAR(255) NOT NULL,
        notes TEXT,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Blacklist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS blacklist (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        reason TEXT,
        added_by VARCHAR(255),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database schema initialized successfully');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initializeDatabase
};

