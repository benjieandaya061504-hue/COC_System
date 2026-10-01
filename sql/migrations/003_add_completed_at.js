// ============================================================
// COC_System — Migration 003: Add completed_at to clients_events
// ============================================================
// Adds a nullable TIMESTAMP column that tracks when an event
// was marked as done (independent of the payment status field).
// NULL = not yet marked done; a real timestamp = done.
// ============================================================

const mysql = require('mysql2/promise');

async function run() {
  const p = await mysql.createPool({
    host: 'localhost', user: 'root', password: '',
    database: 'coc_system', dateStrings: true,
  });

  try {
    await p.execute(
      "ALTER TABLE clients_events ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL AFTER status"
    );
    console.log('1. ALTER TABLE OK — added completed_at column');

    const [rows] = await p.execute(
      'SELECT id, client_name, status, completed_at FROM clients_events ORDER BY id ASC'
    );
    console.log('\n=== clients_events (sample) ===');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await p.end();
  }
}

run();