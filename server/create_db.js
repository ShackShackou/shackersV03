const { Client } = require('pg');
(async () => {
  const cs = 'postgresql://postgres:postgres@localhost:5432/postgres';
  const client = new Client({ connectionString: cs });
  await client.connect();
  try {
    await client.query('CREATE DATABASE "SHACKERS"');
    console.log('DB created or already exists');
  } catch (e) {
    console.log('DB create info:', e.message);
  } finally {
    await client.end();
  }
})();
