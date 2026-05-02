const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Critical for Neon DB
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
