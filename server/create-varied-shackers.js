const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Données LaBrute officielles
const weapons = {
  fast: ['fan', 'keyboard', 'knife', 'leek', 'mug', 'sai', 'racquet'],
  sharp: ['axe', 'broadsword', 'hatchet', 'scimitar', 'sword'],
  heavy: ['bumps', 'flail', 'fryingPan', 'mammothBone', 'morningStar', 'trombone'],
  long: ['baton', 'halbard', 'lance', 'trident', 'whip'],
  thrown: ['noodleBowl', 'piopio', 'shuriken']
};

const skills = {
  offensive: ['herculeanStrength', 'felineAgility', 'lightningBolt', 'fistsOfFury', 
              'tornado', 'fierceVitality', 'hammer', 'flashFlood', 'masterOfArms'],
  defensive: ['vitality', 'immortality', 'shield', 'armor', 'toughenedSkin', 
              'untouchable', 'survival', 'leadSkeleton', 'resistant', 'ironHead'],
  tactical: ['sixthSense', 'hostility', 'sabotage', 'shock', 'counterAttack', 
             'thief', 'reconnaissance', 'spy', 'saboteur', 'hideaway'],
  special: ['monk', 'vampirism', 'chaining', 'haste', 'tamer', 'regeneration', 
            'chef', 'backup', 'leadership', 'potion', 'repulse', 'cry']
};

const pets = ['dog', 'panther', 'bear'];

const shackerNames = {
  epic: ['Ragnarok', 'Bloodfang', 'Deathbringer', 'Shadowstrike', 'Ironclad', 
         'Stormbreaker', 'Frostbite', 'Hellfire', 'Vengeance', 'Doomhammer'],
  warrior: ['Maximus', 'Brutus', 'Ajax', 'Leonidas', 'Achilles', 'Hercules', 
            'Odin', 'Thor', 'Loki', 'Kratos', 'Ares', 'Zeus'],
  female: ['Valkyrie', 'Artemis', 'Athena', 'Freya', 'Xena', 'Diana', 
           'Medusa', 'Elektra', 'Phoenix', 'Raven', 'Fury', 'Storm'],
  funny: ['BaguetteMaster', 'CheeseWarrior', 'NoodleNinja', 'PotatoKing', 
          'BroccoliBeast', 'TofuTerror', 'SausageSamurai', 'MuffinMan'],
  cool: ['Cypher', 'Matrix', 'Neon', 'Vortex', 'Quantum', 'Zenith', 
         'Eclipse', 'Nova', 'Cosmos', 'Nebula', 'Apex', 'Omega']
};

// Builds prédéfinis basés sur LaBrute
const builds = [
  // Tanks
  { name: 'IronWall', str: 2, agi: 2, spd: 2, end: 5, type: 'tank' },
  { name: 'Guardian', str: 3, agi: 2, spd: 2, end: 4, type: 'tank' },
  { name: 'Fortress', str: 2, agi: 3, spd: 2, end: 4, type: 'tank' },
  
  // Damage dealers
  { name: 'Berserker', str: 5, agi: 2, spd: 2, end: 2, type: 'damage' },
  { name: 'Destroyer', str: 4, agi: 3, spd: 2, end: 2, type: 'damage' },
  { name: 'Ravager', str: 4, agi: 2, spd: 3, end: 2, type: 'damage' },
  
  // Speed builds
  { name: 'Lightning', str: 2, agi: 3, spd: 5, end: 1, type: 'speed' },
  { name: 'Flash', str: 2, agi: 3, spd: 4, end: 2, type: 'speed' },
  { name: 'Quicksilver', str: 3, agi: 2, spd: 4, end: 2, type: 'speed' },
  
  // Agility builds
  { name: 'Shadow', str: 2, agi: 5, spd: 2, end: 2, type: 'agility' },
  { name: 'Phantom', str: 2, agi: 4, spd: 3, end: 2, type: 'agility' },
  { name: 'Ghost', str: 3, agi: 4, spd: 2, end: 2, type: 'agility' },
  
  // Balanced
  { name: 'Veteran', str: 3, agi: 3, spd: 3, end: 2, type: 'balanced' },
  { name: 'Champion', str: 3, agi: 3, spd: 2, end: 3, type: 'balanced' },
  { name: 'Elite', str: 3, agi: 2, spd: 3, end: 3, type: 'balanced' }
];

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomWeapons(level) {
  const numWeapons = Math.min(Math.floor(level / 3) + 1, 5);
  const selectedWeapons = new Set();
  const allWeapons = Object.values(weapons).flat();
  
  for (let i = 0; i < numWeapons; i++) {
    selectedWeapons.add(getRandomFromArray(allWeapons));
  }
  
  return Array.from(selectedWeapons);
}

function getRandomSkills(level) {
  const numSkills = Math.min(Math.floor(level / 2), 6);
  const selectedSkills = new Set();
  const allSkills = Object.values(skills).flat();
  
  for (let i = 0; i < numSkills; i++) {
    selectedSkills.add(getRandomFromArray(allSkills));
  }
  
  return Array.from(selectedSkills);
}

function calculateHP(level, endurance) {
  // Formule LaBrute officielle
  const baseHP = 50;
  const hpPerEndurance = 4;
  const hpPerLevel = 3;
  return baseHP + (endurance * hpPerEndurance) + ((level - 1) * hpPerLevel);
}

function calculateXP(level) {
  // XP progressif selon le niveau
  const xpTable = [0, 0, 100, 200, 350, 550, 800, 1100, 1450, 1850, 2300, 
                   2800, 3350, 3950, 4600, 5300, 6050, 6850, 7700, 8600, 9550];
  return xpTable[Math.min(level, 20)] + Math.floor(Math.random() * 50);
}

async function createVariedShackers() {
  try {
    console.log('=== CRÉATION DE SHACKERS ULTRA VARIÉS ===\n');
    
    // Obtenir ou créer les utilisateurs
    let users = await prisma.user.findMany();
    
    // Créer plus d'utilisateurs si nécessaire
    if (users.length < 5) {
      console.log('Création d\'utilisateurs supplémentaires...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newUsers = [
        { email: 'warrior@test.com', name: 'The Warrior', password: hashedPassword },
        { email: 'ninja@test.com', name: 'Shadow Ninja', password: hashedPassword },
        { email: 'viking@test.com', name: 'Viking Lord', password: hashedPassword },
        { email: 'champion@test.com', name: 'Arena Champion', password: hashedPassword }
      ];
      
      for (const userData of newUsers) {
        const existing = await prisma.user.findUnique({ where: { email: userData.email } });
        if (!existing) {
          await prisma.user.create({ data: userData });
        }
      }
      
      users = await prisma.user.findMany();
    }
    
    const createdShackers = [];
    
    // Créer des Shackers pour chaque utilisateur
    for (const user of users) {
      console.log(`\n=== Création pour ${user.name} (${user.email}) ===\n`);
      
      // Nombre de Shackers par utilisateur (5-10)
      const numShackers = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < numShackers; i++) {
        // Choisir un build ou créer des stats aléatoires
        let stats;
        if (Math.random() < 0.7) {
          // 70% de chance d'utiliser un build prédéfini
          stats = getRandomFromArray(builds);
        } else {
          // 30% de chance de stats totalement aléatoires
          let points = 11;
          const end = Math.floor(Math.random() * 4) + 2;
          points -= end;
          const str = Math.min(5, Math.max(2, Math.floor(Math.random() * 4) + 2));
          points -= str;
          const agi = Math.min(5, Math.max(2, Math.floor(Math.random() * 4) + 2));
          points -= agi;
          const spd = Math.max(1, Math.min(5, points));
          
          stats = { 
            str, agi, spd, end, 
            type: 'random',
            name: 'Random'
          };
        }
        
        // Niveau aléatoire (1-20, avec plus de chances pour les niveaux bas/moyens)
        const levelRoll = Math.random();
        let level;
        if (levelRoll < 0.3) level = Math.floor(Math.random() * 5) + 1;      // 30% niveau 1-5
        else if (levelRoll < 0.6) level = Math.floor(Math.random() * 5) + 6;  // 30% niveau 6-10
        else if (levelRoll < 0.85) level = Math.floor(Math.random() * 5) + 11; // 25% niveau 11-15
        else level = Math.floor(Math.random() * 5) + 16;                       // 15% niveau 16-20
        
        // Ajuster les stats selon le niveau
        const levelBonus = Math.floor(level / 2);
        stats.str = Math.min(99, stats.str + Math.floor(Math.random() * levelBonus));
        stats.agi = Math.min(99, stats.agi + Math.floor(Math.random() * levelBonus));
        stats.spd = Math.min(99, stats.spd + Math.floor(Math.random() * levelBonus));
        stats.end = Math.min(99, stats.end + Math.floor(Math.random() * (levelBonus / 2)));
        
        // Nom unique
        const nameCategory = getRandomFromArray(Object.keys(shackerNames));
        const baseName = getRandomFromArray(shackerNames[nameCategory]);
        const suffix = Math.floor(Math.random() * 1000);
        const name = `${baseName}_${suffix}`;
        
        // Genre
        const gender = nameCategory === 'female' || Math.random() > 0.7 ? 'female' : 'male';
        
        // Armes, skills et pet
        const weaponsList = getRandomWeapons(level);
        const skillsList = getRandomSkills(level);
        const pet = level >= 5 && Math.random() < 0.3 ? getRandomFromArray(pets) : null;
        
        // HP et XP
        const hp = calculateHP(level, stats.end);
        const xp = calculateXP(level);
        
        // Bonus de tournoi
        const tournamentWins = level >= 10 ? Math.floor(Math.random() * 5) : 0;
        
        try {
          const shacker = await prisma.shacker.create({
            data: {
              name,
              gender,
              level,
              xp,
              hp,
              strength: stats.str,
              agility: stats.agi,
              speed: stats.spd,
              endurance: stats.end,
              weapons: JSON.stringify(weaponsList),
              skills: JSON.stringify(skillsList),
              pet: pet,
              tournamentWins,
              userId: user.id
            }
          });
          
          createdShackers.push(shacker);
          
          console.log(`✅ ${name} - Level ${level} (${stats.type})`);
          console.log(`   Stats: STR ${stats.str}, AGI ${stats.agi}, SPD ${stats.spd}, END ${stats.end}, HP ${hp}`);
          console.log(`   Weapons: ${weaponsList.join(', ') || 'none'}`);
          console.log(`   Skills: ${skillsList.length > 0 ? skillsList.join(', ') : 'none'}`);
          if (pet) console.log(`   Pet: ${pet}`);
          if (tournamentWins > 0) console.log(`   🏆 Tournament wins: ${tournamentWins}`);
          console.log('');
          
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`   ⚠️ Name ${name} already taken, skipping...`);
          } else {
            console.error(`   ❌ Error creating ${name}:`, error.message);
          }
        }
      }
    }
    
    // Résumé final
    console.log('\n=== RÉSUMÉ FINAL ===');
    console.log(`Total de Shackers créés: ${createdShackers.length}`);
    
    const totalByUser = await prisma.shacker.groupBy({
      by: ['userId'],
      _count: true
    });
    
    for (const group of totalByUser) {
      const user = users.find(u => u.id === group.userId);
      console.log(`${user?.name}: ${group._count} Shackers`);
    }
    
    const totalShackers = await prisma.shacker.count();
    console.log(`\nTotal dans la base: ${totalShackers} Shackers`);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createVariedShackers();