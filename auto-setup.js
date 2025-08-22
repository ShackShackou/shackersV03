const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== CONFIGURATION AUTOMATIQUE COMPLETE ===\n');

// Fonction pour exécuter une commande
function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Execution: ${command}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur: ${error.message}`);
        reject(error);
      } else {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        resolve();
      }
    });
  });
}

async function setup() {
  try {
    const serverPath = path.join(__dirname, 'server');
    const rootPath = __dirname;
    
    console.log('1. Installation des dépendances du serveur...');
    await runCommand('npm install', serverPath);
    
    console.log('\n2. Installation des dépendances du frontend...');
    await runCommand('npm install', rootPath);
    
    console.log('\n3. Génération du client Prisma...');
    await runCommand('npx prisma generate', serverPath);
    
    console.log('\n4. Création de la base de données SQLite...');
    await runCommand('npx prisma db push', serverPath);
    
    console.log('\n5. Lancement des serveurs...');
    
    // Lancer le backend
    exec('npm run dev', { cwd: serverPath }, (error) => {
      if (error) console.error('Backend error:', error);
    });
    console.log('✓ Backend lancé sur http://localhost:4000');
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Lancer le frontend
    exec('npm run dev', { cwd: rootPath }, (error) => {
      if (error) console.error('Frontend error:', error);
    });
    console.log('✓ Frontend lancé sur http://localhost:5173');
    
    console.log('\n=== CONFIGURATION TERMINEE ===');
    console.log('\nACCES AU JEU:');
    console.log('1. Attendez 10 secondes');
    console.log('2. Ouvrez: http://localhost:5173');
    console.log('3. Créez un compte ou connectez-vous');
    console.log('4. Créez vos shackers!\n');
    console.log('Pages disponibles:');
    console.log('- http://localhost:5173/quick-test.html (Test rapide)');
    console.log('- http://localhost:5173/my-shackers.html (Vos shackers)');
    console.log('- http://localhost:5173/create-shacker.html (Créer shacker)\n');
    
    // Garder le processus actif
    console.log('Appuyez sur Ctrl+C pour arrêter les serveurs...');
    
  } catch (error) {
    console.error('Erreur fatale:', error);
  }
}

setup();
