const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Basé sur LaBrute officiel: 11 points à répartir entre 4 stats (2-5 chaque)
const STARTING_POINTS = 11;

// Armes disponibles
const weapons = [
  'fan', 'keyboard', 'knife', 'leek', 'mug', 'sai', 'racquet',
  'axe', 'bumps', 'flail', 'fryingPan', 'hatchet', 'mammothBone',
  'morningStar', 'trombone', 'baton', 'halbard', 'lance', 'trident',
  'whip', 'noodleBowl', 'piopio', 'shuriken', 'broadsword', 'scimitar', 'sword'
];

// Skills disponibles
const skills = [
  'herculeanStrength', 'felineAgility', 'lightningBolt', 'vitality',
  'immortality', 'reconnaissance', 'weaponsMaster', 'martialArts',
  'sixthSense', 'hostility', 'fistsOfFury', 'shield', 'armor',
  'toughenedSkin', 'untouchable', 'sabotage', 'shock', 'bodybuilder',
  'relentless', 'survival', 'leadSkeleton', 'balletShoes', 'determination',
  'firstStrike', 'resistant', 'counterAttack', 'ironHead', 'thief',
  'fierceBrute', 'tragic', 'monk', 'vampirism', 'chaining', 'haste',
  'flashFlood', 'tamer', 'regeneration', 'chef', 'spy', 'saboteur',
  'backup', 'hideaway', 'monk2', 'vampirism2', 'leadership', 'potion',
  'repulse'
];

// Pets disponibles
const pets = ['dog', 'panther', 'bear'];

// Générer des stats aléatoires selon les règles de LaBrute
function generateRandomStats() {
  let points = STARTING_POINTS;
  const stats = {};
  
  // Endurance (2-5)
  stats.endurance = Math.floor(Math.random() * 4) + 2;
  points -= stats.endurance;
  
  // Force (2-5, mais limité par les points restants)
  const maxStr = Math.min(5, points - 4); // Garder au moins 4 points pour les 2 autres stats
  stats.strength = Math.max(2, Math.min(maxStr, Math.floor(Math.random() * 4) + 2));
  points -= stats.strength;
  
  // Agilité (2-5, mais limité par les points restants)
  const maxAgi = Math.min(5, points - 2); // Garder au moins 2 points pour la vitesse
  stats.agility = Math.max(2, Math.min(maxAgi, Math.floor(Math.random() * 4) + 2));
  points -= stats.agility;
  
  // Vitesse (le reste des points)
  stats.speed = points;
  
  return stats;
}

// Générer des builds prédéfinis
function getPredefinedBuilds() {
  return [
    { name: 'Tank', endurance: 5, strength: 3, agility: 2, speed: 1, description: 'High HP, slow' },
    { name: 'Speedster', endurance: 2, strength: 2, agility: 3, speed: 4, description: 'Fast attacks' },
    { name: 'Balanced', endurance: 3, strength: 3, agility: 3, speed: 2, description: 'Well-rounded' },
    { name: 'GlassCannon', endurance: 2, strength: 5, agility: 2, speed: 2, description: 'High damage' },
    { name: 'Dodger', endurance: 2, strength: 2, agility: 5, speed: 2, description: 'High evasion' },
    { name: 'Bruiser', endurance: 4, strength: 4, agility: 2, speed: 1, description: 'Tough fighter' },
    { name: 'Ninja', endurance: 2, strength: 2, agility: 4, speed: 3, description: 'Quick & agile' },
    { name: 'Warrior', endurance: 3, strength: 4, agility: 2, speed: 2, description: 'Strong fighter' },
  ];
}

// Calculer les HP selon la formule de LaBrute
function calculateHP(level, endurance) {
  return 50 + (endurance * 4) + ((level - 1) * 3);
}

// Noms de Shackers
const shackerNames = [
  'IronFist', 'ShadowStrike', 'ThunderBolt', 'CrimsonBlade', 'FrostBite',
  'Viper', 'Titan', 'Phoenix', 'Wraith', 'Havoc', 'Blaze', 'Storm',
  'Ragnar', 'Valkyrie', 'Samurai', 'Gladiator', 'Berserker', 'Paladin',
  'Assassin', 'Mage', 'Archer', 'Knight', 'Barbarian', 'Rogue',
  'DragonSlayer', 'BeastMaster', 'SoulReaper', 'DarkKnight', 'WhiteWalker',
  'NightFury', 'DayBreaker', 'MoonShadow', 'SunBurst', 'StarCrusher'
];

async function createShackers() {
  try {
    console.log('=== CRÉATION DE SHACKERS VARIÉS ===\n');
    
    // Vérifier si l'utilisateur test existe
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@test.com' }
    });

    if (!testUser) {
      console.log('Création de l\'utilisateur test...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await prisma.user.create({
        data: {
          email: 'test@test.com',
          password: hashedPassword,
          name: 'Joueur Test'
        }
      });
    }

    // Créer un autre utilisateur pour la variété
    let player2 = await prisma.user.findUnique({
      where: { email: 'player2@test.com' }
    });

    if (!player2) {
      console.log('Création du joueur 2...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      player2 = await prisma.user.create({
        data: {
          email: 'player2@test.com',
          password: hashedPassword,
          name: 'Player Two'
        }
      });
    }

    const builds = getPredefinedBuilds();
    const createdShackers = [];
    
    // Créer des Shackers avec des builds prédéfinis
    for (let i = 0; i < builds.length; i++) {
      const build = builds[i];
      const name = `${build.name}_${Math.floor(Math.random() * 1000)}`;
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const level = Math.floor(Math.random() * 10) + 1;
      const userId = i % 2 === 0 ? testUser.id : player2.id;
      
      // Ajouter des armes et skills aléatoires
      const numWeapons = Math.floor(Math.random() * 3) + 1;
      const numSkills = Math.floor(Math.random() * 3) + 1;
      const selectedWeapons = [];
      const selectedSkills = [];
      
      for (let w = 0; w < numWeapons; w++) {
        const weapon = weapons[Math.floor(Math.random() * weapons.length)];
        if (!selectedWeapons.includes(weapon)) {
          selectedWeapons.push(weapon);
        }
      }
      
      for (let s = 0; s < numSkills; s++) {
        const skill = skills[Math.floor(Math.random() * skills.length)];
        if (!selectedSkills.includes(skill)) {
          selectedSkills.push(skill);
        }
      }
      
      // Pet aléatoire (30% de chance)
      const pet = Math.random() < 0.3 ? pets[Math.floor(Math.random() * pets.length)] : null;
      
      const hp = calculateHP(level, build.endurance);
      const xp = level * 100 + Math.floor(Math.random() * 50);
      
      const shacker = await prisma.shacker.create({
        data: {
          name,
          gender,
          level,
          xp,
          hp,
          strength: build.strength,
          agility: build.agility,
          speed: build.speed,
          endurance: build.endurance,
          weapons: JSON.stringify(selectedWeapons),
          skills: JSON.stringify(selectedSkills),
          pet: pet,
          userId
        }
      });
      
      createdShackers.push(shacker);
      console.log(`✅ ${name} (${build.description}) - Level ${level}, HP: ${hp}`);
      console.log(`   Stats: STR ${build.strength}, AGI ${build.agility}, SPD ${build.speed}, END ${build.endurance}`);
      console.log(`   Weapons: ${selectedWeapons.join(', ')}`);
      console.log(`   Skills: ${selectedSkills.join(', ')}`);
      if (pet) console.log(`   Pet: ${pet}`);
      console.log('');
    }
    
    // Créer quelques Shackers avec des stats totalement aléatoires
    console.log('--- Shackers avec stats aléatoires ---\n');
    
    for (let i = 0; i < 6; i++) {
      const stats = generateRandomStats();
      const name = shackerNames[Math.floor(Math.random() * shackerNames.length)] + '_' + Math.floor(Math.random() * 100);
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const level = Math.floor(Math.random() * 15) + 1;
      const userId = Math.random() > 0.5 ? testUser.id : player2.id;
      
      // Armes et skills
      const numWeapons = Math.floor(Math.random() * 4) + 1;
      const numSkills = Math.floor(Math.random() * 4) + 1;
      const selectedWeapons = [];
      const selectedSkills = [];
      
      for (let w = 0; w < numWeapons; w++) {
        const weapon = weapons[Math.floor(Math.random() * weapons.length)];
        if (!selectedWeapons.includes(weapon)) {
          selectedWeapons.push(weapon);
        }
      }
      
      for (let s = 0; s < numSkills; s++) {
        const skill = skills[Math.floor(Math.random() * skills.length)];
        if (!selectedSkills.includes(skill)) {
          selectedSkills.push(skill);
        }
      }
      
      const pet = Math.random() < 0.25 ? pets[Math.floor(Math.random() * pets.length)] : null;
      const hp = calculateHP(level, stats.endurance);
      const xp = level * 100 + Math.floor(Math.random() * 100);
      
      const shacker = await prisma.shacker.create({
        data: {
          name,
          gender,
          level,
          xp,
          hp,
          strength: stats.strength,
          agility: stats.agility,
          speed: stats.speed,
          endurance: stats.endurance,
          weapons: JSON.stringify(selectedWeapons),
          skills: JSON.stringify(selectedSkills),
          pet: pet,
          userId
        }
      });
      
      createdShackers.push(shacker);
      console.log(`✅ ${name} - Level ${level}, HP: ${hp}`);
      console.log(`   Stats: STR ${stats.strength}, AGI ${stats.agility}, SPD ${stats.speed}, END ${stats.endurance}`);
      console.log(`   Weapons: ${selectedWeapons.join(', ')}`);
      console.log(`   Skills: ${selectedSkills.join(', ')}`);
      if (pet) console.log(`   Pet: ${pet}`);
      console.log('');
    }
    
    // Afficher le résumé
    const totalShackers = await prisma.shacker.count();
    console.log('\n=== RÉSUMÉ ===');
    console.log(`Total de Shackers créés: ${createdShackers.length}`);
    console.log(`Total de Shackers dans la base: ${totalShackers}`);
    
    // Afficher les stats par utilisateur
    const testUserShackers = await prisma.shacker.count({ where: { userId: testUser.id } });
    const player2Shackers = await prisma.shacker.count({ where: { userId: player2.id } });
    
    console.log(`\nShackers de test@test.com: ${testUserShackers}`);
    console.log(`Shackers de player2@test.com: ${player2Shackers}`);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createShackers();