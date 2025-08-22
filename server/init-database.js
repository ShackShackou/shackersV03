const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initDatabase() {
  console.log('=== INITIALISATION DE LA BASE DE DONNEES ===\n');
  
  try {
    // Créer les tables si elles n'existent pas
    console.log('1. Création/vérification des tables...');
    await prisma.$executeRaw`SELECT 1`;
    console.log('   ✓ Base de données connectée\n');
    
    // Vérifier s'il y a des utilisateurs
    const userCount = await prisma.user.count();
    console.log(`2. Utilisateurs existants: ${userCount}`);
    
    if (userCount === 0) {
      console.log('   -> Aucun utilisateur trouvé');
      console.log('   -> Créez un compte sur http://localhost:5173/login.html\n');
    } else {
      // Lister les utilisateurs et leurs shackers
      const users = await prisma.user.findMany({
        include: {
          shackers: true
        }
      });
      
      console.log('\n   UTILISATEURS ET LEURS SHACKERS:');
      for (const user of users) {
        console.log(`   • ${user.email} (${user.name})`);
        if (user.shackers.length > 0) {
          user.shackers.forEach(s => {
            console.log(`     - ${s.name} (Level ${s.level}, ${s.gender})`);
          });
        } else {
          console.log(`     - Aucun shacker`);
        }
      }
    }
    
    // Compter tous les shackers
    const shackerCount = await prisma.shacker.count();
    console.log(`\n3. Total des shackers dans la base: ${shackerCount}`);
    
    if (shackerCount === 0) {
      console.log('   -> Créez votre premier shacker sur http://localhost:5173/create-shacker.html');
    }
    
    console.log('\n✓ Base de données prête !');
    
  } catch (error) {
    console.error('\n✗ ERREUR:', error.message);
    console.log('\nSolutions possibles:');
    console.log('1. Lancez d\'abord: npx prisma generate');
    console.log('2. Puis: npx prisma db push');
    console.log('3. Enfin relancez ce script');
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
