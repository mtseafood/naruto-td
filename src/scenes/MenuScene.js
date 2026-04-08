import { LEVELS } from '../data/levels.js';
import { NINJA_DATA } from '../data/ninjaData.js';

const SAVE_KEY = 'naruto_td_save';

export function getSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}
export function setSave(data) { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); }

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const save = getSave();
    const W = 390, H = 844;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a00, 0x1a0a00, 0x4a1a00, 0x4a1a00, 1);
    bg.fillRect(0, 0, W, H);

    // Decorative circles (chakra aura)
    for (let i = 0; i < 5; i++) {
      const c = this.add.graphics();
      c.lineStyle(1, 0xFF4500, 0.15 + i * 0.05);
      c.strokeCircle(W / 2, 260, 80 + i * 40);
    }

    // Title
    this.add.text(W / 2, 120, '火影忍者', {
      fontSize: '48px', fill: '#FF4500', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(W / 2, 180, '塔防守護', {
      fontSize: '28px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Ninja icon row
    const ninjaColors = [0xFF8C00, 0x6600AA, 0xFF69B4, 0x999999, 0x00CC44, 0x8855CC, 0xC19A6B, 0xFFD700];
    ninjaColors.forEach((c, i) => {
      const g = this.add.graphics();
      g.fillStyle(c, 1);
      g.fillCircle(40 + i * 44, 260, 16);
    });

    // Level select
    const maxUnlocked = save.maxLevel ?? 1;

    this.add.text(W / 2, 310, '選擇關卡', {
      fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const COLS = 5;
    const BTN_W = 60, BTN_H = 50;
    const levelHitAreas = [];

    LEVELS.forEach((lv, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const bx = 30 + col * 70;
      const by = 340 + row * 80;
      const unlocked = idx + 1 <= maxUnlocked;

      this.add.rectangle(bx + BTN_W / 2, by + BTN_H / 2, BTN_W, BTN_H,
        unlocked ? 0x2a2a2a : 0x111111)
        .setStrokeStyle(1, unlocked ? 0xFF4500 : 0x333333);

      this.add.text(bx + BTN_W / 2, by + 14, `第${lv.id}關`, {
        fontSize: '11px', fill: unlocked ? '#FFD700' : '#555555', fontFamily: 'Arial',
      }).setOrigin(0.5);

      this.add.text(bx + BTN_W / 2, by + 30, lv.name.length > 5 ? lv.name.slice(0, 5) : lv.name, {
        fontSize: '9px', fill: unlocked ? '#AAAAAA' : '#333333', fontFamily: 'Arial',
      }).setOrigin(0.5);

      if (!unlocked) {
        this.add.text(bx + BTN_W / 2, by + 44, '🔒', {
          fontSize: '10px', fontFamily: 'Arial',
        }).setOrigin(0.5);
      }

      if (unlocked) {
        levelHitAreas.push({ idx, x: bx, y: by, w: BTN_W, h: BTN_H });
      }
    });

    // Single scene-level pointer handler — most reliable on mobile
    this.input.on('pointerdown', (pointer) => {
      const px = pointer.x, py = pointer.y;
      for (const area of levelHitAreas) {
        if (px >= area.x && px <= area.x + area.w &&
            py >= area.y && py <= area.y + area.h) {
          this.scene.start('GameScene', { levelIndex: area.idx });
          return;
        }
      }
    });

    // Footer
    this.add.text(W / 2, H - 30, '點擊關卡開始遊戲', {
      fontSize: '14px', fill: '#888888', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // First time: unlock level 1
    if (!save.maxLevel) { setSave({ maxLevel: 1 }); }
  }
}
