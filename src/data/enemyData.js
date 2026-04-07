// All enemy definitions
// hp: base health
// speed: pixels per second
// reward: gold on kill
// damage: lives lost when reaching end
// armor: damage reduction fraction (0 = none, 0.3 = 30% reduction)

export const ENEMY_DATA = {
  sound_ninja: {
    id: 'sound_ninja', name: '音忍',
    hp: 80, speed: 72, reward: 10, damage: 1, armor: 0,
    color: 0x8B8000,
  },
  sound_elite: {
    id: 'sound_elite', name: '音忍精英',
    hp: 160, speed: 65, reward: 20, damage: 1, armor: 0.1,
    color: 0x6B6B00,
  },
  zaku: {
    id: 'zaku', name: '薄荷',
    hp: 220, speed: 78, reward: 30, damage: 1, armor: 0,
    color: 0x556B2F,
  },
  dosu: {
    id: 'dosu', name: '鬼流牙',
    hp: 280, speed: 52, reward: 35, damage: 1, armor: 0.15,
    color: 0x808080,
  },
  kin: {
    id: 'kin', name: '金',
    hp: 190, speed: 82, reward: 25, damage: 1, armor: 0,
    color: 0xB8860B,
  },
  jirobo: {
    id: 'jirobo', name: '次郎坊',
    hp: 900, speed: 38, reward: 100, damage: 2, armor: 0.35,
    color: 0x8B4513, isBoss: true,
  },
  kidomaru: {
    id: 'kidomaru', name: '鬼童丸',
    hp: 650, speed: 55, reward: 90, damage: 2, armor: 0.2,
    color: 0x228B22, isBoss: true,
  },
  tayuya: {
    id: 'tayuya', name: '多由也',
    hp: 720, speed: 48, reward: 95, damage: 2, armor: 0.2,
    color: 0x9932CC, isBoss: true,
  },
  sakon: {
    id: 'sakon', name: '左近',
    hp: 550, speed: 72, reward: 80, damage: 2, armor: 0.15,
    color: 0x4169E1, isBoss: true,
  },
  kabuto: {
    id: 'kabuto', name: '輝',
    hp: 1200, speed: 42, reward: 200, damage: 3, armor: 0.3,
    color: 0xCCCCCC, isBoss: true,
    healNearby: { radius: 80, amount: 15, interval: 3000 },
  },
  orochimaru: {
    id: 'orochimaru', name: '大蛇丸',
    hp: 4000, speed: 28, reward: 600, damage: 5, armor: 0.4,
    color: 0x6A0DAD, isBoss: true,
    phaseAt: 0.5,
  },
};
