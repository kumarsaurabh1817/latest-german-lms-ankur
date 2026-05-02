require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const migrate = async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  try {
    await pool.query(sql);
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
