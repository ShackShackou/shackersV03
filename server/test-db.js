const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ouvrir la base de données SQLite
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database\n');
});

// Vérifier les tables
db.serialize(() => {
  // Lister toutes les tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err);
      return;
    }
    console.log('=== TABLES IN DATABASE ===');
    tables.forEach(table => console.log(`- ${table.name}`));
    console.log();
  });

  // Vérifier les utilisateurs
  db.all("SELECT * FROM User", (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return;
    }
    console.log('=== USERS ===');
    console.log(`Total: ${users ? users.length : 0}`);
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }
    console.log();
  });

  // Vérifier les shackers
  db.all("SELECT * FROM Shacker", (err, shackers) => {
    if (err) {
      console.error('Error fetching shackers:', err);
      return;
    }
    console.log('=== SHACKERS ===');
    console.log(`Total: ${shackers ? shackers.length : 0}`);
    if (shackers && shackers.length > 0) {
      shackers.forEach(shacker => {
        console.log(`- ${shacker.name} (Level ${shacker.level})`);
        console.log(`  Stats: HP=${shacker.hp}, STR=${shacker.strength}, AGI=${shacker.agility}, SPD=${shacker.speed}`);
        console.log(`  User ID: ${shacker.userId}`);
      });
    }
    console.log();
  });
});

// Fermer la connexion
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
  });
}, 2000);
