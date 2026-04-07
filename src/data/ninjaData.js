// All ninja (tower) definitions
// attackCooldown: ms between normal attacks
// jutsuCooldown: ms between jutsu
// jutsuAoe: radius for area damage (0 = single target)
// jutsuIsFullMap: hits all enemies on screen

export const NINJA_DATA = {
  naruto: {
    id: 'naruto', name: '鳴人', cost: 150, alwaysUnlocked: true,
    color: 0xFF8C00,
    forms: [
      {
        formIndex: 0, name: '普通鳴人', color: 0xFF8C00,
        attackRange: 120, attackCooldown: 1200, damage: 18,
        jutsuName: '影分身之術', jutsuCooldown: 8000, jutsuDamage: 45,
        jutsuRange: 130, jutsuAoe: 0, jutsuIsFullMap: false, jutsuTargetCount: 3,
      },
      {
        formIndex: 1, name: '仙人模式', color: 0xFF6600,
        unlockLevel: 5, unlockCost: 500,
        attackRange: 150, attackCooldown: 1000, damage: 35,
        jutsuName: '仙術螺旋丸', jutsuCooldown: 10000, jutsuDamage: 90,
        jutsuRange: 170, jutsuAoe: 60, jutsuIsFullMap: false, jutsuTargetCount: 1,
      },
      {
        formIndex: 2, name: '九尾查克拉模式', color: 0xFF2200,
        unlockLevel: 10, unlockCost: 1200,
        attackRange: 180, attackCooldown: 850, damage: 55,
        jutsuName: '九尾炮', jutsuCooldown: 15000, jutsuDamage: 300,
        jutsuRange: 9999, jutsuAoe: 0, jutsuIsFullMap: true, jutsuTargetCount: -1,
      },
    ],
  },

  sasuke: {
    id: 'sasuke', name: '佐助', cost: 175, alwaysUnlocked: true,
    color: 0x6600AA,
    forms: [
      {
        formIndex: 0, name: '普通佐助', color: 0x6600AA,
        attackRange: 130, attackCooldown: 1100, damage: 22,
        jutsuName: '火遁豪火球之術', jutsuCooldown: 9000, jutsuDamage: 60,
        jutsuRange: 140, jutsuAoe: 40, jutsuIsFullMap: false, jutsuTargetCount: 1,
      },
      {
        formIndex: 1, name: '寫輪眼佐助', color: 0x9900CC,
        unlockLevel: 5, unlockCost: 500,
        attackRange: 155, attackCooldown: 950, damage: 38,
        jutsuName: '天照', jutsuCooldown: 12000, jutsuDamage: 120,
        jutsuRange: 165, jutsuAoe: 0, jutsuIsFullMap: false, jutsuTargetCount: 1,
        jutsuDot: { damage: 15, ticks: 4, interval: 1000 },
      },
      {
        formIndex: 2, name: '須佐能乎佐助', color: 0xCC44FF,
        unlockLevel: 10, unlockCost: 1200,
        attackRange: 185, attackCooldown: 800, damage: 60,
        jutsuName: '千手一摑', jutsuCooldown: 16000, jutsuDamage: 280,
        jutsuRange: 9999, jutsuAoe: 0, jutsuIsFullMap: true, jutsuTargetCount: -1,
        passiveShield: true,
      },
    ],
  },

  sakura: {
    id: 'sakura', name: '小櫻', cost: 130, alwaysUnlocked: true,
    color: 0xFF69B4,
    forms: [
      {
        formIndex: 0, name: '普通小櫻', color: 0xFF69B4,
        attackRange: 110, attackCooldown: 1300, damage: 14,
        jutsuName: '治癒術', jutsuCooldown: 10000, jutsuDamage: 0,
        jutsuRange: 120, jutsuAoe: 80, jutsuIsFullMap: false, jutsuTargetCount: 1,
        jutsuHeal: 40,
      },
      {
        formIndex: 1, name: '修練後小櫻', color: 0xFF1493,
        unlockLevel: 5, unlockCost: 400,
        attackRange: 130, attackCooldown: 1100, damage: 28,
        jutsuName: '群體治癒術', jutsuCooldown: 12000, jutsuDamage: 0,
        jutsuRange: 160, jutsuAoe: 100, jutsuIsFullMap: false, jutsuTargetCount: 1,
        jutsuHeal: 80,
      },
      {
        formIndex: 2, name: '百豪之印小櫻', color: 0xCC0077,
        unlockLevel: 10, unlockCost: 1000,
        attackRange: 150, attackCooldown: 900, damage: 45,
        jutsuName: '百豪之印', jutsuCooldown: 20000, jutsuDamage: 0,
        jutsuRange: 9999, jutsuAoe: 0, jutsuIsFullMap: true, jutsuTargetCount: -1,
        jutsuHeal: 200, jutsuFullHeal: true,
      },
    ],
  },

  kakashi: {
    id: 'kakashi', name: '卡卡西', cost: 200, alwaysUnlocked: true,
    color: 0x999999,
    forms: [
      {
        formIndex: 0, name: '普通卡卡西', color: 0x999999,
        attackRange: 140, attackCooldown: 1000, damage: 25,
        jutsuName: '雷切', jutsuCooldown: 8000, jutsuDamage: 80,
        jutsuRange: 150, jutsuAoe: 0, jutsuIsFullMap: false, jutsuTargetCount: 1,
      },
      {
        formIndex: 1, name: '寫輪眼卡卡西', color: 0xBBBBBB,
        unlockLevel: 5, unlockCost: 550,
        attackRange: 165, attackCooldown: 880, damage: 42,
        jutsuName: '神威', jutsuCooldown: 10000, jutsuDamage: 150,
        jutsuRange: 180, jutsuAoe: 50, jutsuIsFullMap: false, jutsuTargetCount: 1,
      },
      {
        formIndex: 2, name: '六道卡卡西', color: 0xFFFFFF,
        unlockLevel: 10, unlockCost: 1300,
        attackRange: 200, attackCooldown: 750, damage: 65,
        jutsuName: '神威雷切', jutsuCooldown: 14000, jutsuDamage: 350,
        jutsuRange: 9999, jutsuAoe: 0, jutsuIsFullMap: true, jutsuTargetCount: -1,
        jutsuArmorPierce: true,
      },
    ],
  },

  rocklee: {
    id: 'rocklee', name: '李洛克', cost: 140, alwaysUnlocked: true,
    color: 0x00CC44,
    forms: [
      {
        formIndex: 0, name: '普通李洛克', color: 0x00CC44,
        attackRange: 80, attackCooldown: 700, damage: 20,
        jutsuName: '初蓮華', jutsuCooldown: 9000, jutsuDamage: 100,
        jutsuRange: 90, jutsuAoe: 0, jutsuIsFullMap: false, jutsuTargetCount: 1,
      },
      {
        formIndex: 1, name: '卸重錘李洛克', color: 0x00FF66,
        unlockLevel: 5, unlockCost: 450,
        attackRange: 90, attackCooldown: 500, damage: 38,
        jutsuName: '蓮華', jutsuCooldown: 11000, jutsuDamage: 200,
        jutsuRange: 100, jutsuAoe: 0, jutsuIsFullMap: false, jutsuTargetCount: 1,
        jutsuKnockback: true,
      },
      {
        formIndex: 2, name: '八門遁甲李洛克', color: 0xFF4400,
        unlockLevel: 10, unlockCost: 1100,
        attackRange: 110, attackCooldown: 350, damage: 70,
        jutsuName: '晝虎', jutsuCooldown: 18000, jutsuDamage: 400,
        jutsuRange: 9999, jutsuAoe: 0, jutsuIsFullMap: true, jutsuTargetCount: -1,
        jutsuDuration: 5000,
      },
    ],
  },

  hinata: {
    id: 'hinata', name: '雛田', cost: 135, alwaysUnlocked: true,
    color: 0x8855CC,
    forms: [
      {
        formIndex: 0, name: '普通雛田', color: 0x8855CC,
        attackRange: 115, attackCooldown: 1100, damage: 16,
        jutsuName: '八卦三十二掌', jutsuCooldown: 9000, jutsuDamage: 50,
        jutsuRange: 130, jutsuAoe: 70, jutsuIsFullMap: false, jutsuTargetCount: 1,
        jutsuSlow: { factor: 0.5, duration: 2000 },
      },
      {
        formIndex: 1, name: '白眼覺醒雛田', color: 0xAA77FF,
        unlockLevel: 5, unlockCost: 400,
        attackRange: 140, attackCooldown: 950, damage: 30,
        jutsuName: '八卦六十四掌', jutsuCooldown: 11000, jutsuDamage: 90,
        jutsuRange: 160, jutsuAoe: 90, jutsuIsFullMap: false, jutsuTargetCount: 1,
        jutsuSlow: { factor: 0.4, duration: 3000 },
      },
      {
        formIndex: 2, name: '成熟雛田', color: 0xCCAAFF,
        unlockLevel: 10, unlockCost: 1000,
        attackRange: 165, attackCooldown: 850, damage: 48,
        jutsuName: '八卦空掌', jutsuCooldown: 13000, jutsuDamage: 200,
        jutsuRange: 9999, jutsuAoe: 0, jutsuIsFullMap: true, jutsuTargetCount: -1,
        jutsuSlow: { factor: 0.3, duration: 4000 },
      },
    ],
  },

  gaara: {
    id: 'gaara', name: '我愛羅', cost: 180, alwaysUnlocked: true,
    color: 0xC19A6B,
    forms: [
      {
        formIndex: 0, name: '普通我愛羅', color: 0xC19A6B,
        attackRange: 135, attackCooldown: 1400, damage: 20,
        jutsuName: '砂瀑大葬', jutsuCooldown: 9000, jutsuDamage: 70,
        jutsuRange: 145, jutsuAoe: 60, jutsuIsFullMap: false, jutsuTargetCount: 1,
        jutsuSlow: { factor: 0.5, duration: 2000 },
      },
      {
        formIndex: 1, name: '砂之守護我愛羅', color: 0xD4A96A,
        unlockLevel: 5, unlockCost: 500,
        attackRange: 160, attackCooldown: 1200, damage: 38,
        jutsuName: '砂漠浮頭', jutsuCooldown: 11000, jutsuDamage: 130,
        jutsuRange: 170, jutsuAoe: 80, jutsuIsFullMap: false, jutsuTargetCount: 1,
        passiveAura: { radius: 80, defenseBonus: 0.2 },
      },
      {
        formIndex: 2, name: '守鶴鎧我愛羅', color: 0xE8C080,
        unlockLevel: 10, unlockCost: 1300,
        attackRange: 180, attackCooldown: 1000, damage: 60,
        jutsuName: '守鶴・砂塵嵐', jutsuCooldown: 16000, jutsuDamage: 350,
        jutsuRange: 9999, jutsuAoe: 0, jutsuIsFullMap: true, jutsuTargetCount: -1,
        passiveTaunt: true,
      },
    ],
  },

  minato: {
    id: 'minato', name: '水門', cost: 250, alwaysUnlocked: false,
    unlockAfterLevel: 5,
    color: 0xFFD700,
    forms: [
      {
        formIndex: 0, name: '第四代火影', color: 0xFFD700,
        attackRange: 999, attackCooldown: 600, damage: 30,
        jutsuName: '螺旋丸', jutsuCooldown: 7000, jutsuDamage: 100,
        jutsuRange: 999, jutsuAoe: 0, jutsuIsFullMap: false, jutsuTargetCount: 1,
        passiveTeleport: true,
      },
      {
        formIndex: 1, name: '飛雷神水門', color: 0xFFE84D,
        unlockLevel: 5, unlockCost: 600,
        attackRange: 999, attackCooldown: 450, damage: 55,
        jutsuName: '大型螺旋丸', jutsuCooldown: 9000, jutsuDamage: 180,
        jutsuRange: 999, jutsuAoe: 40, jutsuIsFullMap: false, jutsuTargetCount: 1,
        passiveTeleport: true, passiveCrit: { chance: 0.3 },
      },
      {
        formIndex: 2, name: '六道水門', color: 0xFFFFAA,
        unlockLevel: 10, unlockCost: 1500,
        attackRange: 999, attackCooldown: 350, damage: 80,
        jutsuName: '真數千手', jutsuCooldown: 13000, jutsuDamage: 500,
        jutsuRange: 9999, jutsuAoe: 0, jutsuIsFullMap: true, jutsuTargetCount: -1,
        passiveTeleport: true, passiveIgnoreObstacles: true,
      },
    ],
  },
};
