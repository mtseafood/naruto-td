import { LEVELS, LEVEL_PATH, LEVEL_PATH_CELLS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS } from '../data/levels.js';
import { NINJA_DATA } from '../data/ninjaData.js';
import { GridSystem } from '../systems/GridSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { Ninja } from '../entities/Ninja.js';
import { Projectile } from '../entities/Projectile.js';
import { getSave, setSave } from './MenuScene.js';

// Layout constants
const W = 390, H = 844;
const HUD_H = 80;           // top HUD height
const PANEL_Y = 630;        // bottom panel starts here
const PANEL_H = H - PANEL_Y;
const CARD_W = 44, CARD_H = 170, CARD_GAP = 3;

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  /* ─────────────────────── INIT ─────────────────────── */
  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.ninjas = [];
    this.enemies = [];
    this.projectiles = [];
    this.selectedType = null;
    this.gameOver = false;
    this.levelDone = false;
    this._waveCooldown = false;  // prevent double-trigger
    this._popup = null;
  }

  /* ─────────────────────── CREATE ─────────────────────── */
  create() {
    const lv = LEVELS[this.levelIndex];

    // Systems
    this.grid = new GridSystem(LEVEL_PATH_CELLS);
    this.economy = new EconomySystem(lv.startGold, lv.maxLives);
    this.waves = new WaveSystem(this, lv.waves, LEVEL_PATH);

    // Build scene
    this._buildBackground();
    this._buildGrid();
    this._buildHUD();
    this._buildPanel();

    // Input
    this.input.on('pointerdown', this._onTap, this);

    // Listen for hud refresh
    this.events.on('hudUpdate', this._refreshHUD, this);

    // Countdown then first wave
    this._waveCountdown(3);
  }

  /* ─────────────────────── BACKGROUND ─────────────────── */
  _buildBackground() {
    // Forest background
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x1a3a14, 1);
    bg.fillRect(0, HUD_H, W, PANEL_Y - HUD_H);

    // Top HUD
    bg.fillStyle(0x1a0800, 1);
    bg.fillRect(0, 0, W, HUD_H);

    // Separator line
    bg.lineStyle(2, 0xFF4500, 0.6);
    bg.strokeRect(0, HUD_H, W, PANEL_Y - HUD_H - 0);

    // Bottom panel
    bg.fillStyle(0x0d0d0d, 1);
    bg.fillRect(0, PANEL_Y, W, PANEL_H);
    bg.lineStyle(1, 0x333333, 1);
    bg.strokeRect(0, PANEL_Y, W, PANEL_H);
  }

  /* ─────────────────────── GRID ─────────────────────── */
  _buildGrid() {
    this.gridGfx = this.add.graphics().setDepth(1);
    this._redrawGrid();
    this._drawPathArrow();
  }

  _redrawGrid() {
    const g = this.gridGfx;
    g.clear();
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_OFFSET_X + c * CELL_SIZE;
        const y = GRID_OFFSET_Y + r * CELL_SIZE;
        const isPath = this.grid.isPath(c, r);
        const occupied = this.grid.isOccupied(c, r);

        g.fillStyle(isPath ? 0x5C3D1A : occupied ? 0x0a1f0a : 0x1d4a18, 1);
        g.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        g.lineStyle(1, 0x0d2b0d, 0.6);
        g.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  _drawPathArrow() {
    // Subtle gold path line
    const pg = this.add.graphics().setDepth(2);
    pg.lineStyle(3, 0xFFCC00, 0.25);
    pg.beginPath();
    const pts = LEVEL_PATH.filter(p => p.x >= 0 && p.x <= W); // clip off-screen
    if (pts.length > 1) {
      pg.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => pg.lineTo(p.x, p.y));
    }
    pg.strokePath();
  }

  /* ─────────────────────── HUD ─────────────────────── */
  _buildHUD() {
    this.hudGold  = this.add.text(10, 10, '', { fontSize: '17px', fill: '#FFD700', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2 }).setDepth(15);
    this.hudLives = this.add.text(W / 2, 10, '', { fontSize: '17px', fill: '#FF6666', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(15);
    this.hudWave  = this.add.text(W - 10, 10, '', { fontSize: '15px', fill: '#FFFFFF', fontFamily: 'Arial' }).setOrigin(1, 0).setDepth(15);
    this.hudLevel = this.add.text(10, 36, LEVELS[this.levelIndex].name, { fontSize: '13px', fill: '#AA8855', fontFamily: 'Arial' }).setDepth(15);
    this.hudStatus = this.add.text(W - 10, 36, '', { fontSize: '13px', fill: '#88FF88', fontFamily: 'Arial' }).setOrigin(1, 0).setDepth(15);

    // Next-wave button
    this.nextWaveBtn = this._makeButton(W - 10, 56, '▶ 下一波', 14, 0x004400, 0xAAFFAA, () => {
      if (!this.gameOver && !this.levelDone && !this.waves.active && this.waves.hasMoreWaves()) {
        this._launchWave();
      }
    }).setOrigin(1, 0).setDepth(16);

    this._refreshHUD();
  }

  _refreshHUD() {
    const e = this.economy;
    this.hudGold.setText(`💰 ${e.gold}`);
    this.hudLives.setText(`❤️ ${e.lives} / ${e.maxLives}`);
    this.hudWave.setText(`第 ${this.waves.currentWave} / ${this.waves.totalWaves} 波`);
  }

  /* ─────────────────────── BOTTOM PANEL ─────────────────── */
  _buildPanel() {
    this.add.text(10, PANEL_Y + 8, '選擇忍者', { fontSize: '14px', fill: '#FFD700', fontFamily: 'Arial' }).setDepth(15);
    this.add.text(W - 10, PANEL_Y + 8, '點格子放置', { fontSize: '11px', fill: '#888888', fontFamily: 'Arial' }).setOrigin(1, 0).setDepth(15);

    this.cards = [];
    const save = getSave();
    const unlockedMinato = (save.maxLevel ?? 1) >= 5;
    const ninjaList = Object.values(NINJA_DATA).filter(n => n.alwaysUnlocked || (n.id === 'minato' && unlockedMinato));

    const totalW = ninjaList.length * (CARD_W + CARD_GAP) - CARD_GAP;
    const startX = Math.max(5, (W - totalW) / 2);
    const cardY = PANEL_Y + 30;

    ninjaList.forEach((nd, i) => {
      const cx = startX + i * (CARD_W + CARD_GAP);
      const can = this.economy.canAfford(nd.cost);

      // Card bg (interactive)
      const bg = this.add.rectangle(cx + CARD_W / 2, cardY + CARD_H / 2, CARD_W, CARD_H, 0x1a1a1a)
        .setStrokeStyle(1, can ? 0x444444 : 0x222222)
        .setDepth(14)
        .setInteractive();

      // Ninja circle
      const cg = this.add.graphics().setDepth(15);
      cg.fillStyle(nd.color, 1);
      cg.fillCircle(cx + CARD_W / 2, cardY + 28, 16);

      // Name
      const nm = this.add.text(cx + CARD_W / 2, cardY + 52, nd.name, {
        fontSize: '11px', fill: can ? '#FFFFFF' : '#555555', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(15);

      // Cost
      const ct = this.add.text(cx + CARD_W / 2, cardY + 68, `${nd.cost}金`, {
        fontSize: '10px', fill: can ? '#FFD700' : '#444444', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(15);

      // Form dots
      const dots = nd.forms.map((_, fi) => {
        const d = this.add.graphics().setDepth(15);
        d.fillStyle(0x444444, 1);
        d.fillCircle(cx + CARD_W / 2 - (nd.forms.length - 1) * 5 + fi * 10, cardY + CARD_H - 14, 4);
        return d;
      });

      bg.on('pointerdown', (ptr) => {
        ptr.event.stopPropagation();
        this._selectType(nd.id);
      });

      this.cards.push({ id: nd.id, bg, cg, nm, ct, dots, cx, cardY });
    });
  }

  _selectType(id) {
    this.selectedType = id;
    this._closePopup();
    this._refreshCards();
  }

  _refreshCards() {
    for (const card of this.cards) {
      const nd = NINJA_DATA[card.id];
      const can = this.economy.canAfford(nd.cost);
      const sel = this.selectedType === card.id;
      card.bg.setFillStyle(sel ? 0x2a2a00 : 0x1a1a1a);
      card.bg.setStrokeStyle(sel ? 2 : 1, sel ? 0xFFD700 : can ? 0x444444 : 0x222222);
      card.nm.setStyle({ fill: can ? '#FFFFFF' : '#555555' });
      card.ct.setStyle({ fill: can ? '#FFD700' : '#444444' });
    }
  }

  /* ─────────────────────── INPUT ─────────────────────── */
  _onTap(ptr) {
    if (ptr.y < HUD_H || ptr.y >= PANEL_Y) return; // ignore HUD and panel rows

    const cell = this.grid.pixelToGrid(ptr.x, ptr.y);
    if (!cell) return;

    const { col, row } = cell;
    const existing = this.grid.getNinja(col, row);

    if (existing) {
      this._showPopup(existing);
    } else if (this.selectedType && this.grid.isValidPlacement(col, row)) {
      this._placeNinja(col, row, this.selectedType);
    } else if (!this.selectedType && !existing) {
      // Tap empty non-path cell with nothing selected = close popup
      this._closePopup();
    }
  }

  /* ─────────────────────── NINJA PLACEMENT ─────────────── */
  _placeNinja(col, row, type) {
    const nd = NINJA_DATA[type];
    if (!this.economy.spend(nd.cost)) {
      this._toast('金幣不足！', 0xFF4444);
      return;
    }
    const ninja = new Ninja(this, col, row, type);
    // Initialize jutsu timer so first jutsu fires after half cooldown
    ninja.lastJutsuTime = this.time.now - ninja.form.jutsuCooldown / 2;
    this.ninjas.push(ninja);
    this.grid.placeNinja(col, row, ninja);
    this._redrawGrid();
    this._refreshHUD();
    this._refreshCards();
  }

  /* ─────────────────────── POPUP ─────────────────────── */
  _showPopup(ninja) {
    this._closePopup();
    this.selectedType = null;
    this._refreshCards();

    const PW = 280, PH = 260;
    const px = (W - PW) / 2, py = 180;
    const items = [];
    const self = this;

    function txt(x, y, s, style) {
      return self.add.text(x, y, s, { fontFamily: 'Arial', ...style }).setDepth(22);
    }

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(20).setInteractive();
    overlay.on('pointerdown', () => this._closePopup());
    items.push(overlay);

    const panel = this.add.rectangle(px + PW / 2, py + PH / 2, PW, PH, 0x111111, 0.97).setDepth(21);
    panel.setStrokeStyle(2, 0xFFD700);
    items.push(panel);

    const f = ninja.form;
    items.push(txt(px + 10, py + 10, `${ninja.data.name}・${f.name}`, { fontSize: '15px', fill: '#FFD700', fontStyle: 'bold' }));
    items.push(txt(px + 10, py + 34, `等級 ${ninja.level} / 10     攻擊 ${Math.floor(f.damage * (1 + (ninja.level - 1) * 0.05))}`, { fontSize: '13px', fill: '#CCCCCC' }));
    items.push(txt(px + 10, py + 54, `射程 ${f.attackRange}px     攻速 ${(1000 / f.attackCooldown).toFixed(1)}/s`, { fontSize: '13px', fill: '#CCCCCC' }));
    items.push(txt(px + 10, py + 74, `忍術：${f.jutsuName}`, { fontSize: '12px', fill: '#FF8800' }));
    items.push(txt(px + 10, py + 92, f.jutsuIsFullMap ? '（全地圖攻擊）' : `範圍 ${f.jutsuRange}px  冷卻 ${(f.jutsuCooldown / 1000).toFixed(0)}s`, { fontSize: '11px', fill: '#888888' }));

    // Level up button
    const lvCost = ninja.levelUpCost();
    const canLv = ninja.level < 10 && this.economy.canAfford(lvCost);
    const lvBtn = this._makeButton(px + PW / 2 - 70, py + 130, `升級\n(${lvCost}金)`, 12,
      canLv ? 0x003388 : 0x222222, canLv ? '#88AAFF' : '#555555',
      canLv ? () => {
        this.economy.spend(lvCost);
        ninja.level++;
        ninja._draw();
        this._refreshHUD();
        this._showPopup(ninja);
      } : null).setOrigin(0.5).setDepth(22);
    items.push(lvBtn);

    // Evolve button
    const nf = ninja.getNextForm();
    if (nf) {
      const canEvo = ninja.level >= nf.unlockLevel && this.economy.canAfford(nf.unlockCost);
      const evoBtn = this._makeButton(px + PW / 2 + 30, py + 130, `進化\n(${nf.unlockCost}金)\nLv${nf.unlockLevel}↑`, 12,
        canEvo ? 0x884400 : 0x222222, canEvo ? '#FFD700' : '#555555',
        canEvo ? () => {
          this.economy.spend(nf.unlockCost);
          ninja.evolve();
          this._redrawGrid();
          this._refreshHUD();
          this._showPopup(ninja);
        } : null).setOrigin(0.5).setDepth(22);
      items.push(evoBtn);

      // Hint if can't evolve yet
      if (!canEvo) {
        items.push(txt(px + PW / 2 + 30, py + 158, `需Lv${nf.unlockLevel}+${nf.unlockCost}金`, { fontSize: '9px', fill: '#666666' }).setOrigin(0.5));
      }
    }

    // Sell button
    const sv = ninja.sellValue();
    const sellBtn = this._makeButton(px + PW / 2, py + 198, `撤退 (+${sv}金)`, 13,
      0x440000, '#FF8888', () => {
        this.economy.addGold(sv);
        this.grid.removeNinja(ninja.col, ninja.row);
        const idx = this.ninjas.indexOf(ninja);
        if (idx > -1) this.ninjas.splice(idx, 1);
        ninja.destroy();
        this._redrawGrid();
        this._refreshHUD();
        this._refreshCards();
        this._closePopup();
      }).setOrigin(0.5).setDepth(22);
    items.push(sellBtn);

    // Close button
    const closeBtn = txt(px + PW - 12, py + 8, '✕', { fontSize: '18px', fill: '#FFFFFF' }).setOrigin(0.5).setInteractive();
    closeBtn.on('pointerdown', (p) => { p.event.stopPropagation(); this._closePopup(); });
    items.push(closeBtn);

    this._popup = { items };
  }

  _closePopup() {
    if (!this._popup) return;
    this._popup.items.forEach(i => i.destroy());
    this._popup = null;
  }

  /* ─────────────────────── WAVE MANAGEMENT ─────────────── */
  _waveCountdown(sec) {
    this.hudStatus.setText(`準備！${sec}秒後開始`);
    if (sec <= 0) { this._launchWave(); return; }
    this.time.delayedCall(1000, () => this._waveCountdown(sec - 1));
  }

  _launchWave() {
    if (!this.waves.hasMoreWaves() && this.waves.currentWave > 0) return;
    this.waves.startNextWave();
    this._refreshHUD();
    this.hudStatus.setText(`第 ${this.waves.currentWave} 波進行中`);
    this.nextWaveBtn.setVisible(false);
  }

  /* ─────────────────────── UPDATE LOOP ─────────────────── */
  update(time, delta) {
    if (this.gameOver || this.levelDone) return;

    this.waves.update(time);

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(time, delta);

      if (e.isDead) {
        this.economy.addGold(e.reward);
        this.economy.onKill();
        this._refreshHUD();
        this._refreshCards();
        e.destroy();
        this.enemies.splice(i, 1);
      } else if (e.reachedEnd) {
        this.economy.loseLife(e.damage);
        this._refreshHUD();
        e.destroy();
        this.enemies.splice(i, 1);
        if (this.economy.isDead()) { this._onGameOver(); return; }
      }
    }

    // Update ninjas
    for (const n of this.ninjas) n.update(time, delta, this.enemies);

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(time, delta);
      if (p.isDone) { p.destroy(); this.projectiles.splice(i, 1); }
    }

    // Wave clear check
    if (this.waves.spawnDone && this.enemies.length === 0 && !this._waveCooldown) {
      this._waveCooldown = true;
      this.time.delayedCall(300, () => {
        this._waveCooldown = false;
        if (this.waves.hasMoreWaves()) {
          this._onWaveClear();
        } else {
          this._onLevelComplete();
        }
      });
    }
  }

  _onWaveClear() {
    const bonus = 30 + this.waves.currentWave * 10;
    this.economy.addGold(bonus);
    this._refreshHUD();
    this._refreshCards();
    this._toast(`波次清除！+${bonus}金`, 0x44FF88);
    this.hudStatus.setText('準備下一波...');
    this.nextWaveBtn.setVisible(true);
    // Auto-launch after 8 seconds
    this.time.delayedCall(8000, () => {
      if (!this.gameOver && !this.levelDone && !this.waves.active && this.waves.hasMoreWaves()) {
        this._launchWave();
      }
    });
  }

  /* ─────────────────────── WIN / LOSE ─────────────────── */
  _onLevelComplete() {
    this.levelDone = true;
    const lv = LEVELS[this.levelIndex];
    this.economy.addGold(lv.completionBonus);

    // Save progress
    const save = getSave();
    const next = this.levelIndex + 2; // levelIndex is 0-based, id is 1-based
    if (next > (save.maxLevel ?? 1)) save.maxLevel = next;
    if (lv.unlocksMinato) save.minatoUnlocked = true;
    setSave(save);

    this._showEndScreen(true);
  }

  _onGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this._showEndScreen(false);
  }

  _showEndScreen(win) {
    this._closePopup();
    const lv = LEVELS[this.levelIndex];

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(30);
    const titleTxt = win ? '任務完成！' : '任務失敗';
    const titleColor = win ? '#FFD700' : '#FF2222';

    this.add.text(W / 2, 260, titleTxt, {
      fontSize: '38px', fill: titleColor, fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(31);

    if (win) {
      this.add.text(W / 2, 330, `+${lv.completionBonus} 金幣獎勵`, {
        fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(31);
      this.add.text(W / 2, 365, `擊殺: ${this.economy.totalKills}  金幣: ${this.economy.gold}`, {
        fontSize: '14px', fill: '#AAAAAA', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(31);
    } else {
      this.add.text(W / 2, 330, '木葉村陷落了...', {
        fontSize: '18px', fill: '#AAAAAA', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(31);
    }

    const hasNext = this.levelIndex + 1 < LEVELS.length;
    if (win && hasNext) {
      this._makeButton(W / 2, 430, '下一關 ▶', 20, 0x004400, '#88FF88', () => {
        this.scene.start('GameScene', { levelIndex: this.levelIndex + 1 });
      }).setOrigin(0.5).setDepth(32);
    }

    this._makeButton(W / 2, win && hasNext ? 500 : 430, '再試一次', 18, 0x440000, '#FF8888', () => {
      this.scene.start('GameScene', { levelIndex: this.levelIndex });
    }).setOrigin(0.5).setDepth(32);

    this._makeButton(W / 2, win && hasNext ? 570 : 500, '主選單', 18, 0x222222, '#FFFFFF', () => {
      this.scene.start('MenuScene');
    }).setOrigin(0.5).setDepth(32);
  }

  /* ─────────────────────── HELPERS ─────────────────────── */
  spawnProjectile(x, y, target, damage, opts = {}) {
    const p = new Projectile(this, x, y, target, damage, opts);
    this.projectiles.push(p);
    return p;
  }

  _makeButton(x, y, label, fontSize, bgColor, textColor, callback) {
    const lines = label.split('\n');
    const bh = Math.max(40, lines.length * (fontSize + 4) + 10);
    const bw = Math.max(120, label.replace(/\n/g, '').length * (fontSize * 0.6) + 24);

    const btn = this.add.container(x, y).setDepth(21);
    const bg = this.add.rectangle(0, 0, bw, bh, bgColor, callback ? 1 : 0.4).setStrokeStyle(1, 0x444444);
    const lbl = this.add.text(0, 0, label, {
      fontSize: `${fontSize}px`, fill: textColor, fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5);
    btn.add([bg, lbl]);

    if (callback) {
      bg.setInteractive();
      bg.on('pointerdown', (p) => { p.event.stopPropagation(); callback(); });
      bg.on('pointerover', () => bg.setFillStyle(Phaser.Display.Color.IntegerToColor(bgColor).brighten(20).color));
      bg.on('pointerout', () => bg.setFillStyle(bgColor));
    }
    return btn;
  }

  _toast(msg, color = 0xFFFFFF) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.add.text(W / 2, PANEL_Y - 30, msg, {
      fontSize: '16px', fill: hex, fontFamily: 'Arial', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: t, y: PANEL_Y - 70, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }
}
