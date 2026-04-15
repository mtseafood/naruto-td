// Level definitions
// layout: 0 = S-shape, 1 = U-shape, 2 = Maze (see maps.js)

export const LEVELS = [
  {
    id: 1, name: '木葉村入口', layout: 0,
    story: '大蛇丸的音忍部隊正在進攻木葉村！保衛村子的入口！',
    startGold: 300, maxLives: 20, completionBonus: 150,
    waves: [
      { groups: [{ type: 'sound_ninja', count: 6, startDelay: 0, interval: 1600 }] },
      { groups: [{ type: 'sound_ninja', count: 9, startDelay: 0, interval: 1300 }] },
      { groups: [
        { type: 'sound_ninja', count: 6, startDelay: 0, interval: 1200 },
        { type: 'sound_elite', count: 3, startDelay: 3000, interval: 2000 },
      ]},
    ],
  },
  {
    id: 2, name: '木葉村城門', layout: 0,
    story: '更多精英音忍突破了外圍防線，逼近城門！',
    startGold: 350, maxLives: 20, completionBonus: 180,
    waves: [
      { groups: [{ type: 'sound_elite', count: 5, startDelay: 0, interval: 1800 }] },
      { groups: [
        { type: 'sound_ninja', count: 8, startDelay: 0, interval: 1200 },
        { type: 'sound_elite', count: 4, startDelay: 2000, interval: 1800 },
      ]},
      { groups: [
        { type: 'sound_elite', count: 8, startDelay: 0, interval: 1400 },
        { type: 'zaku', count: 2, startDelay: 5000, interval: 3000 },
      ]},
    ],
  },
  {
    id: 3, name: '中忍考試場', layout: 0,
    story: '薄荷（ザク）和金帶領一隊音忍突擊考試場！',
    startGold: 400, maxLives: 18, completionBonus: 200,
    waves: [
      { groups: [
        { type: 'zaku', count: 3, startDelay: 0, interval: 2500 },
        { type: 'sound_ninja', count: 6, startDelay: 1000, interval: 1200 },
      ]},
      { groups: [
        { type: 'kin', count: 4, startDelay: 0, interval: 2000 },
        { type: 'sound_elite', count: 5, startDelay: 1500, interval: 1500 },
      ]},
      { groups: [
        { type: 'zaku', count: 3, startDelay: 0, interval: 2000 },
        { type: 'kin', count: 3, startDelay: 2000, interval: 2000 },
        { type: 'sound_elite', count: 6, startDelay: 4000, interval: 1200 },
      ]},
    ],
  },
  {
    id: 4, name: '森林地帶', layout: 1,
    story: '鬼流牙（ドス）帶著重裝音忍在森林中設伏！',
    startGold: 450, maxLives: 18, completionBonus: 220,
    waves: [
      { groups: [
        { type: 'dosu', count: 2, startDelay: 0, interval: 4000 },
        { type: 'sound_ninja', count: 8, startDelay: 2000, interval: 1100 },
      ]},
      { groups: [
        { type: 'dosu', count: 3, startDelay: 0, interval: 3500 },
        { type: 'zaku', count: 4, startDelay: 1000, interval: 2000 },
      ]},
      { groups: [
        { type: 'sound_elite', count: 10, startDelay: 0, interval: 1000 },
        { type: 'dosu', count: 3, startDelay: 4000, interval: 3000 },
        { type: 'kin', count: 4, startDelay: 6000, interval: 1800 },
      ]},
    ],
  },
  {
    id: 5, name: '大蛇丸的巢穴外圍', layout: 1,
    story: '木葉忍者追蹤到大蛇丸的巢穴，輝現身阻止追擊！',
    startGold: 500, maxLives: 16, completionBonus: 300,
    unlocksMinato: true,
    waves: [
      { groups: [
        { type: 'sound_elite', count: 8, startDelay: 0, interval: 1100 },
        { type: 'dosu', count: 3, startDelay: 2000, interval: 2500 },
      ]},
      { groups: [
        { type: 'zaku', count: 5, startDelay: 0, interval: 1800 },
        { type: 'kin', count: 5, startDelay: 2000, interval: 1800 },
        { type: 'dosu', count: 3, startDelay: 4000, interval: 2500 },
      ]},
      { groups: [
        { type: 'sound_elite', count: 12, startDelay: 0, interval: 900 },
        { type: 'kabuto', count: 1, startDelay: 8000, interval: 1 },
      ]},
    ],
  },
  {
    id: 6, name: '音之四人組・次郎坊', layout: 1,
    story: '音之四人組的次郎坊以強力防禦攔截前進路線！',
    startGold: 500, maxLives: 15, completionBonus: 250,
    waves: [
      { groups: [
        { type: 'sound_elite', count: 10, startDelay: 0, interval: 1000 },
      ]},
      { groups: [
        { type: 'zaku', count: 5, startDelay: 0, interval: 1800 },
        { type: 'kin', count: 5, startDelay: 2500, interval: 1800 },
      ]},
      { groups: [
        { type: 'sound_elite', count: 8, startDelay: 0, interval: 1000 },
        { type: 'jirobo', count: 1, startDelay: 6000, interval: 1 },
      ]},
    ],
  },
  {
    id: 7, name: '音之四人組・鬼童丸與多由也', layout: 2,
    story: '鬼童丸和多由也聯手出現，絕招接連不斷！',
    startGold: 550, maxLives: 15, completionBonus: 280,
    waves: [
      { groups: [
        { type: 'dosu', count: 4, startDelay: 0, interval: 2200 },
        { type: 'sound_elite', count: 8, startDelay: 1000, interval: 1000 },
      ]},
      { groups: [
        { type: 'kidomaru', count: 1, startDelay: 0, interval: 1 },
        { type: 'sound_elite', count: 10, startDelay: 3000, interval: 1000 },
      ]},
      { groups: [
        { type: 'tayuya', count: 1, startDelay: 0, interval: 1 },
        { type: 'zaku', count: 6, startDelay: 4000, interval: 1500 },
        { type: 'kidomaru', count: 1, startDelay: 10000, interval: 1 },
      ]},
    ],
  },
  {
    id: 8, name: '音之四人組・左近', layout: 2,
    story: '速度最快的左近帶領精銳部隊高速突破防線！',
    startGold: 600, maxLives: 15, completionBonus: 300,
    waves: [
      { groups: [
        { type: 'kin', count: 6, startDelay: 0, interval: 1400 },
        { type: 'sound_elite', count: 10, startDelay: 1000, interval: 900 },
      ]},
      { groups: [
        { type: 'sakon', count: 1, startDelay: 0, interval: 1 },
        { type: 'sound_elite', count: 12, startDelay: 2000, interval: 850 },
      ]},
      { groups: [
        { type: 'jirobo', count: 1, startDelay: 0, interval: 1 },
        { type: 'tayuya', count: 1, startDelay: 5000, interval: 1 },
        { type: 'sakon', count: 1, startDelay: 10000, interval: 1 },
      ]},
    ],
  },
  {
    id: 9, name: '大蛇丸巢穴深處', layout: 2,
    story: '四人組全員集結！加上輝的支援，這是最後的防線！',
    startGold: 650, maxLives: 12, completionBonus: 350,
    waves: [
      { groups: [
        { type: 'kidomaru', count: 1, startDelay: 0, interval: 1 },
        { type: 'tayuya', count: 1, startDelay: 5000, interval: 1 },
        { type: 'sound_elite', count: 15, startDelay: 1000, interval: 800 },
      ]},
      { groups: [
        { type: 'jirobo', count: 1, startDelay: 0, interval: 1 },
        { type: 'sakon', count: 1, startDelay: 4000, interval: 1 },
        { type: 'zaku', count: 8, startDelay: 2000, interval: 1300 },
      ]},
      { groups: [
        { type: 'kabuto', count: 1, startDelay: 0, interval: 1 },
        { type: 'jirobo', count: 1, startDelay: 6000, interval: 1 },
        { type: 'sakon', count: 1, startDelay: 6000, interval: 1 },
        { type: 'kidomaru', count: 1, startDelay: 6000, interval: 1 },
        { type: 'tayuya', count: 1, startDelay: 6000, interval: 1 },
      ]},
    ],
  },
  {
    id: 10, name: '最終決戰・大蛇丸', layout: 3,
    story: '木葉崩壞！大蛇丸親自出馬！以木葉之名，絕不退讓！',
    startGold: 700, maxLives: 10, completionBonus: 800,
    waves: [
      { groups: [
        { type: 'sound_elite', count: 20, startDelay: 0, interval: 700 },
        { type: 'kabuto', count: 1, startDelay: 8000, interval: 1 },
      ]},
      { groups: [
        { type: 'jirobo', count: 2, startDelay: 0, interval: 8000 },
        { type: 'sakon', count: 2, startDelay: 4000, interval: 8000 },
        { type: 'sound_elite', count: 15, startDelay: 2000, interval: 700 },
      ]},
      { groups: [
        { type: 'kabuto', count: 1, startDelay: 0, interval: 1 },
        { type: 'tayuya', count: 2, startDelay: 5000, interval: 8000 },
        { type: 'kidomaru', count: 2, startDelay: 5000, interval: 8000 },
        { type: 'orochimaru', count: 1, startDelay: 20000, interval: 1 },
      ]},
    ],
  },
];
