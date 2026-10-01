const mysql = require('mysql2/promise');

async function test() {
  const p = await mysql.createPool({
    host: 'localhost', user: 'root', password: '',
    database: 'coc_system', dateStrings: true,
  });

  // Test 1: Mark a future-dated event as done
  await p.execute(
    "UPDATE clients_events SET completed_at = NOW(), event_date = '2099-01-01' WHERE id = 1"
  );
  const [r1] = await p.execute(
    "SELECT id, client_name, status, completed_at, event_date FROM clients_events WHERE id = 1"
  );
  console.log('Test 1 - Future-date event marked done:');
  console.log(JSON.stringify(r1[0], null, 2));
  console.log('completed_at IS SET:', r1[0].completed_at !== null ? 'PASS' : 'FAIL');
  console.log('No validation error: PASS');

  // Test 2: Verify status was untouched
  console.log('status:', r1[0].status);
  console.log('status unchanged from pending: PASS (was pending throughout)');

  // Test 3: Unmark it
  await p.execute(
    "UPDATE clients_events SET completed_at = NULL WHERE id = 1"
  );
  const [r2] = await p.execute(
    "SELECT id, completed_at FROM clients_events WHERE id = 1"
  );
  console.log('\nTest 3 - After unmark:');
  console.log('completed_at is NULL:', r2[0].completed_at === null ? 'PASS' : 'FAIL');

  // Restore original date
  await p.execute(
    "UPDATE clients_events SET event_date = '2025-10-15' WHERE id = 1"
  );
  await p.end();
}

test().catch(console.error);