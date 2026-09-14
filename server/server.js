// ============================================================
// COC_System server entry point
// Loads .env, verifies the MySQL pool, then starts Express.
// ============================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Verify the DB pool can actually reach coc_system before
    // accepting traffic — fails fast at startup if not.
    const conn = await pool.getConnection();
    console.log('MySQL pool connected');
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();