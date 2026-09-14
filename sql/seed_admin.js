// ============================================================
// COC_System — Seed Admin User
// Run ONCE:  node sql/seed_admin.js
//
// Prompts for a username and password (never hardcoded),
// bcrypt-hashes the password, and inserts the admin row.
// ============================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const readline = require('readline');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Readline promise wrapper — hides the password while typing.
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    if (hidden) {
      const stdin = process.openStdin();
      process.stdin.on('data', (char) => {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.pause();
            break;
          default:
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(question + Array(rl.line.length + 1).join('*'));
            break;
        }
      });
    }
    rl.question(question, (answer) => resolve(answer));
  });
}

async function main() {
  try {
    const username = (await ask('Admin username: ')).trim();
    if (!username) throw new Error('Username cannot be empty.');

    const password = await ask('Password: ', true);
    if (!password) throw new Error('Password cannot be empty.');
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const confirm = await ask('Confirm password: ', true);
    if (password !== confirm) throw new Error('Passwords do not match.');

    const passwordHash = await bcrypt.hash(password, 10);

    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [result] = await pool.execute(
      'INSERT INTO admin (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    console.log(`\nAdmin "${username}" created successfully (id=${result.insertId}).`);
    await pool.end();
  } catch (err) {
    console.error('\nFailed to seed admin:', err.message);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();