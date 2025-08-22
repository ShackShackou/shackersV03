const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('=== CREATION DONNEES TEST ===\n');
  
  try {
    // 1. Créer un utilisateur test
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {},
      create: {
        email: 'test@test.com',
        password: hashedPassword,
        name: 'Joueur Test'
      }
    });
    
    console.log('✓ Utilisateur créé: test@test.com (mot de passe: test123)');
    
    // 2. Créer des shackers pour cet utilisateur
    const shackers = [
      { name: 'Brutus', gender: 'male', level: 5, hp: 120, strength: 15, agility: 10, speed: 8 },
      { name: 'Xena', gender: 'female', level: 7, hp: 100, strength: 12, agility: 18, speed: 14 },
      { name: 'Thor', gender: 'male', level: 10, hp: 150, strength: 20, agility: 8, speed: 10 }
    ];
    
    for (const shackerData of shackers) {
      const existingShacker = await prisma.shacker.findFirst({
        where: {
          name: shackerData.name,
          userId: user.id
        }
      });
      
      if (!existingShacker) {
        await prisma.shacker.create({
          data: {
            ...shackerData,
            userId: user.id
          }
        });
        console.log(`✓ Shacker créé: ${shackerData.name} (Level ${shackerData.level})`);
      } else {
        console.log(`- Shacker existe déjà: ${shackerData.name}`);
      }
    }
    
    // 3. Afficher le résumé
    const totalShackers = await prisma.shacker.count({
      where: { userId: user.id }
    });
    
    console.log(`\n=== RESUME ===`);
    console.log(`Email: test@test.com`);
    console.log(`Mot de passe: test123`);
    console.log(`Nombre de shackers: ${totalShackers}`);
    console.log(`\nOuvrez http://localhost:5173 pour jouer!`);
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
