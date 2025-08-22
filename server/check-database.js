const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== CHECKING DATABASE ===\n');
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`Total users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n--- USERS ---');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }
    
    // Check shackers
    const shackers = await prisma.shacker.findMany({
      include: { user: true }
    });
    console.log(`\nTotal shackers: ${shackers.length}`);
    
    if (shackers.length > 0) {
      console.log('\n--- SHACKERS ---');
      shackers.forEach(shacker => {
        console.log(`- ${shacker.name} (Level ${shacker.level}) - Owner: ${shacker.user.email} - Gender: ${shacker.gender}`);
        console.log(`  Stats: HP=${shacker.hp}, STR=${shacker.strength}, AGI=${shacker.agility}, SPD=${shacker.speed}`);
        console.log(`  ID: ${shacker.id}`);
      });
    }
    
    // Check fights
    const fights = await prisma.fight.findMany();
    console.log(`\nTotal fights: ${fights.length}`);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
