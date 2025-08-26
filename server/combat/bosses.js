const bosses = [
  {
    id: 'goldclaw',
    name: 'GoldClaw',
    base: 'bear',
    scale: 2,
    initiative: -0.5,
    strength: 400,
    agility: 2,
    speed: 1,
    hp: 100000,
    counter: 0,
    combo: -0.2,
    block: -0.25,
    evasion: 0.1,
    accuracy: 0.75,
    disarm: 0.05,
    damage: 5,
    reach: 3,
    count: 1,
    reward: 1,
    odds: 10,
  },
  {
    id: 'emberfang',
    name: 'EmberFang',
    base: 'panther',
    scale: 3,
    initiative: -0.5,
    strength: 46,
    agility: 16,
    speed: 240,
    hp: 50000,
    counter: 0,
    combo: 0.7,
    block: 0,
    evasion: 0.2,
    accuracy: 0.75,
    disarm: 0,
    damage: 3,
    reach: 3,
    count: 1,
    reward: 1,
    odds: 10,
  },
  {
    id: 'cerberus',
    name: 'Cerberus',
    base: 'dog',
    scale: 2.15,
    initiative: 1.3,
    strength: 45,
    agility: 5,
    speed: 3.6,
    hp: 10000,
    counter: 0,
    combo: 0,
    block: 0,
    evasion: -0.2,
    accuracy: 0.75,
    disarm: 0,
    damage: 3,
    reach: 1,
    count: 3,
    reward: 0.2,
    odds: 1,
  },
];

function selectBoss() {
  const totalOdds = bosses.reduce((sum, b) => sum + b.odds, 0);
  const roll = Math.random() * totalOdds;
  let acc = 0;
  for (const boss of bosses) {
    acc += boss.odds;
    if (roll < acc) {
      return { ...boss };
    }
  }
  return { ...bosses[0] };
}

module.exports = { bosses, selectBoss };
