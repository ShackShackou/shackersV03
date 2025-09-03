const { Client } = require('pg');
(async () => {
  // Connect to default 'postgres' DB using provided password
  const cs = 'postgresql://postgres:010582@localhost:5432/postgres';
  const client = new Client({ connectionString: cs });
  await client.connect();
  try {
    await client.query('CREATE DATABASE "SHACKERS"');
    console.log('DB SHACKERS created');
  } catch (e) {
    console.log('DB SHACKERS info:', e.message);
  }
  try {
    await client.query('CREATE DATABASE "labrute_dev"');
    console.log('DB labrute_dev created');
  } catch (e) {
    console.log('DB labrute_dev info:', e.message);
  }
  await client.end();
})();
