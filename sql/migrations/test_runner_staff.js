const http = require('http');
const mysql = require('mysql2/promise');

const BASE = 'http://localhost:5000/api';
let cookies = '';

function req(method, path, body, skipCookie) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 5000, path: '/api' + path, method, headers: { 'Content-Type': 'application/json' } };
    if (!skipCookie && cookies) opts.headers['Cookie'] = cookies;
    const r = http.request(opts, (res) => {
      if (res.headers['set-cookie']) cookies = res.headers['set-cookie'].join('; ');
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (body != null) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  let pass = 0, fail = 0;
  const results = [];
  let assignId = null;

  function check(n, label, ok) {
    const isOk = typeof ok === 'function' ? ok() : ok;
    if (isOk) pass++; else fail++;
    results.push({ n, label, ok: isOk });
  }

  // Login
  console.log('\n--- Login ---');
  const login = await req('POST', '/login', { username: 'admin', password: 'admin' });
  console.log('Login:', login.s, JSON.stringify(login.b));
  if (login.s !== 200) { console.log('Login failed — aborting'); return; }

  // --- Test 1: Create staff ---
  console.log('\n--- Test 1: Create staff ---');
  const c1 = await req('POST', '/staff', { name: 'Test Staff', position: 'Tester', contact_number: '0917-000-0001' });
  console.log('   Response:', JSON.stringify(c1.b));
  check(1, 'Create staff returns 201', c1.s === 201);
  const staffId = c1.b ? c1.b.id : null;

  // --- Test 2: Update staff ---
  console.log('\n--- Test 2: Update staff ---');
  const c2 = await req('PUT', '/staff/' + staffId, { name: 'Updated Staff', position: 'Senior Tester', contact_number: '0917-000-0002' });
  console.log('   Response:', JSON.stringify(c2.b));
  check(2, 'Update staff returns 200', c2.s === 200 && c2.b && c2.b.name === 'Updated Staff');

  // --- Test 3: Assign staff to an active event BEFORE delete ---
  console.log('\n--- Test 3: Assign staff to event 3 ---');
  const c3 = await req('POST', '/staff/assign', { staff_id: staffId, event_id: 3 });
  console.log('   Response:', JSON.stringify(c3.b));
  check(3, 'Assign staff returns 201', c3.s === 201);
  assignId = c3.b ? c3.b.id : null;

  // --- Test 4: Duplicate assign (idempotent) ---
  console.log('\n--- Test 4: Duplicate assign ---');
  const c4 = await req('POST', '/staff/assign', { staff_id: staffId, event_id: 3 });
  console.log('   Response:', JSON.stringify(c4.b));
  check(4, 'Duplicate assign returns 200 with alreadyExisted=true', c4.s === 200 && c4.b && c4.b.alreadyExisted === true);

  // --- Test 5: GET /staff/assigned/:eventId ---
  console.log('\n--- Test 5: List assigned staff for event 3 ---');
  const c5 = await req('GET', '/staff/assigned/3');
  console.log('   Response:', JSON.stringify(c5.b));
  check(5, 'List assigned returns 200 with our staff', c5.s === 200 && Array.isArray(c5.b) && c5.b.some(s => s.staffId === staffId));

  // --- Test 6: Unassign ---
  console.log('\n--- Test 6: Unassign staff ---');
  const c6 = await req('DELETE', '/staff/assign/' + assignId);
  console.log('   Response:', JSON.stringify(c6.b));
  check(6, 'Unassign returns 200', c6.s === 200);

  // Verify unassign took effect
  const c6b = await req('GET', '/staff/assigned/3');
  const stillAssigned = Array.isArray(c6b.b) && c6b.b.some(s => s.staffId === staffId);
  check(6.1, 'Unassign actually removed the row', !stillAssigned);

  // --- Test 7: Assign to nonexistent client ---
  console.log('\n--- Test 7: Assign to nonexistent client ---');
  const c7 = await req('POST', '/staff/assign', { staff_id: staffId, event_id: 99999 });
  console.log('   Response:', JSON.stringify(c7.b));
  check(7, 'Assign to nonexistent client returns 404', c7.s === 404);

  // --- Test 8: Delete staff + verify CASCADE ---
  console.log('\n--- Test 8: Delete staff ---');
  // First re-assign so we have something to cascade
  await req('POST', '/staff/assign', { staff_id: staffId, event_id: 3 });
  const c8 = await req('DELETE', '/staff/' + staffId);
  console.log('   Response:', JSON.stringify(c8.b));
  check(8, 'Delete staff returns 200', c8.s === 200);

  const db = await mysql.createPool({ host:'localhost', user:'root', password:'', database:'coc_system', dateStrings: true });
  const [esRows] = await db.execute('SELECT * FROM event_staff WHERE staff_id = ?', [staffId]);
  console.log('   event_staff rows for deleted staff:', esRows.length, '(expected 0)');
  check(8.1, 'CASCADE removed event_staff rows', esRows.length === 0);
  await db.end();

  // --- Test 9: No auth = 401 ---
  console.log('\n--- Test 9: No auth guard ---');
  const c9 = await req('GET', '/staff', null, true);
  console.log('   Response:', JSON.stringify(c9.b));
  check(9, 'No auth returns 401', c9.s === 401);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} Test ${r.n}: ${r.label}`);
  }
  console.log(`\nPassed: ${pass}/${pass+fail}  Failed: ${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(console.error);