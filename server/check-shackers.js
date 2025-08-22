// Script simple pour vérifier les shackers dans la base de données
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('=== VERIFICATION DE LA BASE DE DONNEES ===\n');
    
    // 1. Vérifier les utilisateurs
    const users = await prisma.user.findMany();
    console.log(`Nombre d'utilisateurs: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\nUTILISATEURS:');
      for (const user of users) {
        console.log(`  - ${user.email} (${user.name})`);
        
        // Récupérer les shackers de cet utilisateur
        const userShackers = await prisma.shacker.findMany({
          where: { userId: user.id }
        });
        
        if (userShackers.length > 0) {
          console.log(`    Shackers de ${user.email}:`);
          userShackers.forEach(s => {
            console.log(`      * ${s.name} - Level ${s.level} (${s.gender})`);
          });
        } else {
          console.log(`    -> Aucun shacker`);
        }
      }
    } else {
      console.log('\n=> AUCUN UTILISATEUR DANS LA BASE');
      console.log('=> Créez d\'abord un compte sur http://localhost:5173/login.html');
    }
    
    // 2. Vérifier tous les shackers
    const allShackers = await prisma.shacker.findMany();
    console.log(`\nNombre total de shackers: ${allShackers.length}`);
    
    if (allShackers.length === 0) {
      console.log('\n=> AUCUN SHACKER DANS LA BASE');
      console.log('=> Créez-en un sur http://localhost:5173/create-shacker.html');
    }
    
  } catch (error) {
    console.error('ERREUR:', error.message);
    console.log('\n=> Assurez-vous que le serveur est lancé avec:');
    console.log('   cd server && npm run dev');
  } finally {
    await prisma.$disconnect();
  }
}

main();
