import { LEVELS, LEVEL_PATH, LEVEL_PATH_CELLS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS } from '../data/levels.js';
import { NINJA_DATA } from '../data/ninjaData.js';
import { GridSystem } from '../systems/GridSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { Ninja } from '../entities/Ninja.js';
import { Projectile } from '../entities/Projectile.js';

// Save helpers
const SAVE_KEY = 'naruto_td_save';
function getSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } }
function setSave(data) { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); }

// ── Desktop-first layout ──────────────────────────────────
const W = 960, H = 640;
const HUD_H = 50;

// Grid area: left side
const GRID_RIGHT = GRID_OFFSET_X + GRID_COLS * CELL_SIZE; // ~400

// Right panel
const PANEL_X = GRID_RIGHT + 20;  // 420
const PANEL_W = W - PANEL_X - 10; // 530
const PANEL_TOP = HUD_H + 5;      // 55

// Card grid inside right panel (2 rows × 4 cols)
const CARD_COLS = 4;
const CARD_W = 120, CARD_H = 80, CARD_GAP = 10;

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.ninjas = [];
    this.enemies = [];
    this.projectiles = [];
    this.selectedType = null;
    this.gameOver = false;
    this.levelDone = false;
    this._waveCooldown = false;
    this._popup = null;
  }

  create() {
    // Zoom camera to match DPR so all game coords stay at 960×640 scale
    const dpr = window.GAME_DPR || 1;
    this.cameras.main.setZoom(dpr);
    // Shift camera origin so (0,0) in game space maps to top-left of canvas
    this.cameras.main.setPosition(0, 0);
    this.cameras.main.setBounds(0, 0, 960, 640);

    const lv = LEVELS[this.levelIndex];
    this.grid = new GridSystem(LEVEL_PATH_CELLS);
    this.economy = new EconomySystem(lv.startGold, lv.maxLives);
    this.waves = new WaveSystem(this, lv.waves, LEVEL_PATH);

    this._buildBackground();
    this._buildGrid();
    this._buildHUD();
    this._buildPanel();

    this.input.on('pointerdown', this._onTap, this);
    this.events.on('hudUpdate', this._refreshHUD, this);
    this._waveCountdown(3);
  }

  /* ───── BACKGROUND ───── */
  _buildBackground() {
    const bg = this.add.graphics().setDepth(0);
    // HUD bar
    bg.fillStyle(0x1a0800, 1);
    bg.fillRect(0, 0, W, HUD_H);
    // Grid area
    bg.fillStyle(0x1a3a14, 1);
    bg.fillRect(0, HUD_H, GRID_RIGHT + 10, H - HUD_H);
    // Right panel
    bg.fillStyle(0x111111, 1);
    bg.fillRect(PANEL_X - 10, HUD_H, W - PANEL_X + 10, H - HUD_H);
    // Divider
    bg.lineStyle(2, 0x333333, 1);
    bg.lineBetween(PANEL_X - 10, HUD_H, PANEL_X - 10, H);
  }

  /* ───── GRID ───── */
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
    const pg = this.add.graphics().setDepth(2);
    pg.lineStyle(3, 0xFFCC00, 0.25);
    pg.beginPath();
    const pts = LEVEL_PATH.filter(p => p.x >= 0 && p.x <= GRID_RIGHT + 10);
    if (pts.length > 1) {
      pg.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => pg.lineTo(p.x, p.y));
    }
    pg.strokePath();
  }

  /* ───── HUD (top bar) ───── */
  _buildHUD() {
    const ts = { fontFamily: 'Arial', stroke: '#000', strokeThickness: 2 };
    this.hudGold  = this.add.text(15, 14, '', { ...ts, fontSize: '18px', fill: '#FFD700' }).setDepth(15);
    this.hudLives = this.add.text(180, 14, '', { ...ts, fontSize: '18px', fill: '#FF6666' }).setDepth(15);
    this.hudWave  = this.add.text(370, 14, '', { ...ts, fontSize: '16px', fill: '#FFFFFF' }).setDepth(15);
    this.hudLevel = this.add.text(550, 14, LEVELS[this.levelIndex].name, { ...ts, fontSize: '15px', fill: '#AA8855' }).setDepth(15);
    this.hudStatus = this.add.text(W - 15, 14, '', { ...ts, fontSize: '15px', fill: '#88FF88' }).setOrigin(1, 0).setDepth(15);

    // Story text (first 3 seconds)
    const story = this.add.text(W / 2, H / 2 - 40, LEVELS[this.levelIndex].story, {
      fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 3, wordWrap: { width: 500 }, align: 'center',
    }).setOrigin(0.5).setDepth(25).setAlpha(0.9);
    this.tweens.add({ targets: story, alpha: 0, delay: 2500, duration: 800, onComplete: () => story.destroy() });

    this._refreshHUD();
  }

  _refreshHUD() {
    const e = this.economy;
    this.hudGold.setText(`💰 ${e.gold}`);
    this.hudLives.setText(`❤️ ${e.lives} / ${e.maxLives}`);
    this.hudWave.setText(`波次 ${this.waves.currentWave} / ${this.waves.totalWaves}`);
  }

  /* ───── RIGHT PANEL (ninja cards + controls) ───── */
  _buildPanel() {
    // Section title
    this.add.text(PANEL_X, PANEL_TOP, '選擇忍者', { fontSize: '16px', fill: '#FFD700', fontFamily: 'Arial' }).setDepth(15);
    this.add.text(PANEL_X, PANEL_TOP + 20, '選擇後點擊地圖格子放置', { fontSize: '11px', fill: '#777', fontFamily: 'Arial' }).setDepth(15);

    // Ninja cards in 2 rows × 4 cols
    this.cards = [];
    const save = getSave();
    const unlockedMinato = (save.maxLevel ?? 1) >= 5;
    const ninjaList = Object.values(NINJA_DATA).filter(n => n.alwaysUnlocked || (n.id === 'minato' && unlockedMinato));

    const cardsStartY = PANEL_TOP + 45;
    ninjaList.forEach((nd, i) => {
      const col = i % CARD_COLS;
      const row = Math.floor(i / CARD_COLS);
      const cx = PANEL_X + col * (CARD_W + CARD_GAP);
      const cy = cardsStartY + row * (CARD_H + CARD_GAP);
      const can = this.economy.canAfford(nd.cost);

      const bg = this.add.rectangle(cx + CARD_W / 2, cy + CARD_H / 2, CARD_W, CARD_H, 0x1a1a1a)
        .setStrokeStyle(1, can ? 0x444444 : 0x222222).setDepth(14).setInteractive();

      const cg = this.add.graphics().setDepth(15);
      cg.fillStyle(nd.color, 1);
      cg.fillCircle(cx + 30, cy + CARD_H / 2, 18);

      const nm = this.add.text(cx + 58, cy + 18, nd.name, {
        fontSize: '14px', fill: can ? '#FFFFFF' : '#555', fontFamily: 'Arial', fontStyle: 'bold',
      }).setDepth(15);

      const ct = this.add.text(cx + 58, cy + 38, `${nd.cost} 金`, {
        fontSize: '12px', fill: can ? '#FFD700' : '#444', fontFamily: 'Arial',
      }).setDepth(15);

      // Form dots
      nd.forms.forEach((_, fi) => {
        const d = this.add.graphics().setDepth(15);
        d.fillStyle(0x444444, 1);
        d.fillCircle(cx + 58 + fi * 12, cy + 58, 4);
      });

      bg.on('pointerdown', (ptr) => { ptr.event.stopPropagation(); this._selectType(nd.id); });

      this.cards.push({ id: nd.id, bg, cg, nm, ct, cx, cy });
    });

    // ── Wave controls area ──
    const ctrlY = cardsStartY + 2 * (CARD_H + CARD_GAP) + 20;
    this.add.text(PANEL_X, ctrlY, '波次控制', { fontSize: '14px', fill: '#888', fontFamily: 'Arial' }).setDepth(15);

    // Next wave button
    this.nextWaveBtn = this.add.rectangle(PANEL_X + 80, ctrlY + 35, 160, 36, 0x004400)
      .setStrokeStyle(1, 0x00AA00).setDepth(15).setInteractive();
    this.nextWaveBtnTxt = this.add.text(PANEL_X + 80, ctrlY + 35, '▶ 下一波', {
      fontSize: '15px', fill: '#88FF88', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(16);
    this.nextWaveBtn.on('pointerdown', () => {
      if (!this.gameOver && !this.levelDone && !this.waves.active && this.waves.hasMoreWaves()) {
        this._launchWave();
      }
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

  /* ───── INPUT ───── */
  _onTap(ptr) {
    // Only handle clicks in the grid area
    if (ptr.x > GRID_RIGHT + 5 || ptr.y < GRID_OFFSET_Y) return;

    const cell = this.grid.pixelToGrid(ptr.x, ptr.y);
    if (!cell) return;
    const { col, row } = cell;
    const existing = this.grid.getNinja(col, row);

    if (existing) {
      this._showPopup(existing);
    } else if (this.selectedType && this.grid.isValidPlacement(col, row)) {
      this._placeNinja(col, row, this.selectedType);
    } else {
      this._closePopup();
    }
  }

  /* ───── NINJA PLACEMENT ───── */
  _placeNinja(col, row, type) {
    const nd = NINJA_DATA[type];
    if (!this.economy.spend(nd.cost)) { this._toast('金幣不足！', 0xFF4444); return; }
    const ninja = new Ninja(this, col, row, type);
    ninja.lastJutsuTime = this.time.now - ninja.form.jutsuCooldown / 2;
    this.ninjas.push(ninja);
    this.grid.placeNinja(col, row, ninja);
    this._redrawGrid();
    this._refreshHUD();
    this._refreshCards();
  }

  /* ───── POPUP (ninja info — shown in right panel area) ───── */
  _showPopup(ninja) {
    this._closePopup();
    this.selectedType = null;
    this._refreshCards();

    const PW = 300, PH = 260;
    const px = PANEL_X + 10, py = 330;
    const items = [];
    const self = this;

    function txt(x, y, s, style) {
      return self.add.text(x, y, s, { fontFamily: 'Arial', ...style }).setDepth(22);
    }

    const panel = this.add.rectangle(px + PW / 2, py + PH / 2, PW, PH, 0x1a1a1a, 0.97).setDepth(21);
    panel.setStrokeStyle(2, 0xFFD700);
    items.push(panel);

    const f = ninja.form;
    const lvBonus = 1 + (ninja.level - 1) * 0.05;
    items.push(txt(px + 12, py + 10, `${ninja.data.name}・${f.name}`, { fontSize: '16px', fill: '#FFD700', fontStyle: 'bold' }));
    items.push(txt(px + 12, py + 36, `等級 ${ninja.level}/10   攻擊 ${Math.floor(f.damage * lvBonus)}   射程 ${f.attackRange}`, { fontSize: '13px', fill: '#CCC' }));
    items.push(txt(px + 12, py + 56, `攻速 ${(1000 / f.attackCooldown).toFixed(1)}/s`, { fontSize: '13px', fill: '#CCC' }));
    items.push(txt(px + 12, py + 78, `忍術：${f.jutsuName}${f.jutsuIsFullMap ? '（全地圖）' : ''}`, { fontSize: '13px', fill: '#FF8800' }));

    // Buttons row
    const btnY = py + 115;

    // Level up
    const lvCost = ninja.levelUpCost();
    const canLv = ninja.level < 10 && this.economy.canAfford(lvCost);
    items.push(this._panelBtn(px + 12, btnY, 85, 36, `升級 ${lvCost}金`, canLv ? 0x003388 : 0x222222, canLv ? '#88AAFF' : '#555',
      canLv ? () => { this.economy.spend(lvCost); ninja.level++; ninja._draw(); this._refreshHUD(); this._showPopup(ninja); } : null));

    // Evolve
    const nf = ninja.getNextForm();
    if (nf) {
      const canEvo = ninja.level >= nf.unlockLevel && this.economy.canAfford(nf.unlockCost);
      items.push(this._panelBtn(px + 107, btnY, 85, 36, `進化 ${nf.unlockCost}金`, canEvo ? 0x884400 : 0x222222, canEvo ? '#FFD700' : '#555',
        canEvo ? () => { this.economy.spend(nf.unlockCost); ninja.evolve(); this._redrawGrid(); this._refreshHUD(); this._showPopup(ninja); } : null));
      if (!canEvo) items.push(txt(px + 107, btnY + 40, `需Lv${nf.unlockLevel}`, { fontSize: '10px', fill: '#666' }));
    }

    // Sell
    const sv = ninja.sellValue();
    items.push(this._panelBtn(px + 202, btnY, 85, 36, `撤退 +${sv}金`, 0x440000, '#FF8888', () => {
      this.economy.addGold(sv);
      this.grid.removeNinja(ninja.col, ninja.row);
      const idx = this.ninjas.indexOf(ninja);
      if (idx > -1) this.ninjas.splice(idx, 1);
      ninja.destroy();
      this._redrawGrid(); this._refreshHUD(); this._refreshCards(); this._closePopup();
    }));

    // Close
    const closeBtn = txt(px + PW - 18, py + 8, '✕', { fontSize: '18px', fill: '#FFF' }).setInteractive();
    closeBtn.on('pointerdown', (p) => { p.event.stopPropagation(); this._closePopup(); });
    items.push(closeBtn);

    this._popup = { items };
  }

  _panelBtn(x, y, w, h, label, bgColor, textColor, callback) {
    const fillStr = typeof textColor === 'number' ? '#' + textColor.toString(16).padStart(6, '0') : textColor;
    const container = this.add.container(x + w / 2, y + h / 2).setDepth(22);
    const bg = this.add.rectangle(0, 0, w, h, bgColor, callback ? 1 : 0.4).setStrokeStyle(1, 0x444444);
    const lbl = this.add.text(0, 0, label, { fontSize: '11px', fill: fillStr, fontFamily: 'Arial', align: 'center' }).setOrigin(0.5);
    container.add([bg, lbl]);
    if (callback) { bg.setInteractive(); bg.on('pointerdown', (p) => { p.event.stopPropagation(); callback(); }); }
    return container;
  }

  _closePopup() {
    if (!this._popup) return;
    this._popup.items.forEach(i => i.destroy());
    this._popup = null;
  }

  /* ───── WAVE MANAGEMENT ───── */
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
    this.nextWaveBtnTxt.setVisible(false);
  }

  /* ───── UPDATE LOOP ───── */
  update(time, delta) {
    if (this.gameOver || this.levelDone) return;

    this.waves.update(time);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(time, delta);
      if (e.isDead) {
        this.economy.addGold(e.reward); this.economy.onKill();
        this._refreshHUD(); this._refreshCards();
        e.destroy(); this.enemies.splice(i, 1);
      } else if (e.reachedEnd) {
        this.economy.loseLife(e.damage); this._refreshHUD();
        e.destroy(); this.enemies.splice(i, 1);
        if (this.economy.isDead()) { this._onGameOver(); return; }
      }
    }

    for (const n of this.ninjas) n.update(time, delta, this.enemies);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(time, delta);
      if (p.isDone) { p.destroy(); this.projectiles.splice(i, 1); }
    }

    if (this.waves.spawnDone && this.enemies.length === 0 && !this._waveCooldown) {
      this._waveCooldown = true;
      this.time.delayedCall(300, () => {
        this._waveCooldown = false;
        if (this.waves.hasMoreWaves()) this._onWaveClear();
        else this._onLevelComplete();
      });
    }
  }

  _onWaveClear() {
    const bonus = 30 + this.waves.currentWave * 10;
    this.economy.addGold(bonus);
    this._refreshHUD(); this._refreshCards();
    this._toast(`波次清除！+${bonus}金`, 0x44FF88);
    this.hudStatus.setText('準備下一波...');
    this.nextWaveBtn.setVisible(true);
    this.nextWaveBtnTxt.setVisible(true);
    this.time.delayedCall(8000, () => {
      if (!this.gameOver && !this.levelDone && !this.waves.active && this.waves.hasMoreWaves()) this._launchWave();
    });
  }

  /* ───── WIN / LOSE ───── */
  _onLevelComplete() {
    this.levelDone = true;
    const lv = LEVELS[this.levelIndex];
    this.economy.addGold(lv.completionBonus);
    const save = getSave();
    const next = this.levelIndex + 2;
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
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(30);

    const cx = W / 2, baseY = 180;
    this.add.text(cx, baseY, win ? '任務完成！' : '任務失敗', {
      fontSize: '42px', fill: win ? '#FFD700' : '#FF2222', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(31);

    if (win) {
      this.add.text(cx, baseY + 60, `+${lv.completionBonus} 金幣獎勵    擊殺: ${this.economy.totalKills}`, {
        fontSize: '18px', fill: '#CCC', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(31);
    } else {
      this.add.text(cx, baseY + 60, '木葉村陷落了...', {
        fontSize: '18px', fill: '#AAA', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(31);
    }

    const hasNext = this.levelIndex + 1 < LEVELS.length;
    let btnY = baseY + 120;

    if (win && hasNext) {
      this._endBtn(cx, btnY, '下一關 ▶', 0x004400, '#88FF88', () => {
        this.scene.start('GameScene', { levelIndex: this.levelIndex + 1 });
      }); btnY += 60;
    }
    this._endBtn(cx, btnY, '再試一次', 0x440000, '#FF8888', () => {
      this.scene.start('GameScene', { levelIndex: this.levelIndex });
    }); btnY += 60;
    this._endBtn(cx, btnY, '主選單', 0x222222, '#FFFFFF', () => { window.showMenu(); });
  }

  _endBtn(x, y, label, bgColor, textColor, callback) {
    const bg = this.add.rectangle(x, y, 200, 44, bgColor).setStrokeStyle(1, 0x666666).setDepth(31).setInteractive();
    this.add.text(x, y, label, { fontSize: '18px', fill: textColor, fontFamily: 'Arial' }).setOrigin(0.5).setDepth(32);
    bg.on('pointerdown', callback);
  }

  /* ───── HELPERS ───── */
  spawnProjectile(x, y, target, damage, opts = {}) {
    const p = new Projectile(this, x, y, target, damage, opts);
    this.projectiles.push(p);
    return p;
  }

  _toast(msg, color = 0xFFFFFF) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.add.text(GRID_RIGHT / 2, H - 30, msg, {
      fontSize: '16px', fill: hex, fontFamily: 'Arial', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: t, y: H - 70, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }
}
