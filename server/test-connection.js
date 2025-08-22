const { Client } = require('pg');

const passwords = [
  'postgres',
  'admin',
  'password',
  '123456',
  'admin123',
  'root',
  'postgresql',
  '',  // mot de passe vide
  'Password123',
  'pass'
];

async function testPasswords() {
  console.log('Test des mots de passe PostgreSQL courants...\n');
  
  for (const password of passwords) {
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',  // base par défaut
      password: password,
      port: 5432,
    });

    try {
      await client.connect();
      console.log(`✅ SUCCÈS! Mot de passe trouvé: "${password}"`);
      
      // Essayer de créer la base de données
      try {
        await client.query('CREATE DATABASE labrute');
        console.log('✅ Base de données "labrute" créée avec succès!');
      } catch (err) {
        if (err.code === '42P04') {
          console.log('ℹ️  Base de données "labrute" existe déjà.');
        } else {
          console.log('❌ Erreur lors de la création de la base:', err.message);
        }
      }
      
      await client.end();
      
      // Mettre à jour le fichier .env
      const fs = require('fs');
      const envContent = `DATABASE_URL="postgresql://postgres:${password}@localhost:5432/labrute?schema=public"
JWT_SECRET="your-secret-key-here-change-in-production"
PORT=4000`;
      
      fs.writeFileSync('.env', envContent);
      console.log('\n✅ Fichier .env mis à jour avec le bon mot de passe!');
      
      return true;
    } catch (err) {
      await client.end();
      console.log(`❌ "${password}" - échec`);
    }
  }
  
  console.log('\n❌ Aucun mot de passe standard ne fonctionne.');
  console.log('Vous devez modifier manuellement le fichier .env avec votre mot de passe PostgreSQL.');
  return false;
}

testPasswords();
