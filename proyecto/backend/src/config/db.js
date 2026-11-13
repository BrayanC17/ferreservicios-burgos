const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '-05:00', // hora de Colombia
  dateStrings: false,
  ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
});

// Alinea la sesión de MySQL con la hora de Colombia en cada conexión nueva.
pool.pool.on('connection', (conn) => conn.query("SET time_zone = '-05:00'"));

module.exports = pool;