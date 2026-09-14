const mysql = require('mysql2/promise');

async function run() {
  const p = await mysql.createPool({
    host: 'localhost', user: 'root', password: '',
    database: 'coc_system', dateStrings: true,
  });

  try {
    await p.execute(
      "ALTER TABLE event_categories ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#4caf50' AFTER name"
    );
    console.log('1. ALTER TABLE OK');

    await p.execute("UPDATE event_categories SET color = '#e91e63' WHERE name = 'Wedding'");
    await p.execute("UPDATE event_categories SET color = '#9c27b0' WHERE name = 'Debut'");
    await p.execute("UPDATE event_categories SET color = '#03a9f4' WHERE name = 'Christening'");
    await p.execute("UPDATE event_categories SET color = '#607d8b' WHERE name = 'Funeral'");
    await p.execute("UPDATE event_categories SET color = '#4caf50' WHERE name = 'Meeting'");
    console.log('2. Seed colors OK');

    const [rows] = await p.execute(
      'SELECT id, name, color FROM event_categories ORDER BY id ASC'
    );
    console.log('\n=== event_categories ===');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await p.end();
  }
}

run();