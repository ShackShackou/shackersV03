const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Mettre à jour le mot de passe pour test@test.com
    const user = await prisma.user.update({
      where: { email: 'test@test.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Mot de passe mis à jour pour test@test.com');
    console.log('Email: test@test.com');
    console.log('Mot de passe: password123');
    
    // Compter les Shackers de cet utilisateur
    const shackers = await prisma.shacker.findMany({
      where: { userId: user.id }
    });
    
    console.log(`\nCet utilisateur a ${shackers.length} Shackers:`);
    shackers.forEach(s => {
      console.log(`- ${s.name} (Level ${s.level})`);
    });
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();