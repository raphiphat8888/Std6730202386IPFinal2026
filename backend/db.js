require('dotenv').config();
const mysql = require('mysql2/promise');

const TABLE_NAME = process.env.DB_TABLE || 'Raphiphat_6730202386';

const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'ip_std6730202386',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ip_std6730202386',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
let isConnected = false;

async function getPool() {
  if (pool) return pool;
  try {
    pool = mysql.createPool(poolConfig);
    // Test connection
    const connection = await pool.getConnection();
    connection.release();
    isConnected = true;
    console.log(`[DB] Connected successfully to MySQL (${poolConfig.database} on ${poolConfig.host})`);
    
    // Ensure table exists
    await ensureTableExists();
    return pool;
  } catch (err) {
    console.warn(`[DB] Could not connect to MySQL database: ${err.message}`);
    console.warn(`[DB] Falling back to in-memory store.`);
    pool = null;
    isConnected = false;
    return null;
  }
}

async function ensureTableExists() {
  if (!pool) return;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(100) NOT NULL,
      \`position\` VARCHAR(100) NOT NULL,
      \`salary\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      \`status\` ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createTableSql);

  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM \`${TABLE_NAME}\``);
  if (rows[0].total === 0) {
    const seedSql = `
      INSERT INTO \`${TABLE_NAME}\` (\`name\`, \`position\`, \`salary\`, \`status\`) VALUES
      ('John Doe', 'Software Engineer', 45000, 'Active'),
      ('Jane Smith', 'Product Designer', 38000, 'Active'),
      ('Mike Johnson', 'HR Specialist', 32000, 'On Leave'),
      ('Sara Wilson', 'Finance Analyst', 52000, 'Active'),
      ('David Brown', 'Marketing Manager', 68000, 'Active');
    `;
    await pool.query(seedSql);
    console.log(`[DB] Seeded initial data into \`${TABLE_NAME}\``);
  }
}

module.exports = {
  getPool,
  TABLE_NAME,
  isDbConnected: () => isConnected
};
