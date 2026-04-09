import { LEVELS } from '../data/levels.js';
import { MAP_LAYOUTS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS } from '../data/maps.js';
import { NINJA_DATA } from '../data/ninjaData.js';
import { PALETTE, SPRITE_PIXELS } from '../data/spriteData.js';
import { GridSystem } from '../systems/GridSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { Ninja } from '../entities/Ninja.js';
import { Projectile } from '../entities/Projectile.js';

// ── Save helpers ──────────────────────────────────────────
const SAVE_KEY = 'naruto_td_save';
function getSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } }
function setSave(d) { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); }

// ── Layout constants ──────────────────────────────────────
const W = 960, H = 640;
const HUD_H = 50;
const GRID_RIGHT  = GRID_OFFSET_X + GRID_COLS * CELL_SIZE; // ~400
const PANEL_X     = GRID_RIGHT + 20;   // 420
const CARD_COLS   = 4;
const CARD_W = 120, CARD_H = 80, CARD_GAP = 10;
const PANEL_TOP   = HUD_H + 5;

// ── Achievements definition ───────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_blood',   name: '初見血',       desc: '擊殺第一個敵人',         icon: '🗡️',  check: s => s.totalKills >= 1 },
  { id: 'hundred_kills', name: '百敵斬',        desc: '累計擊殺100個敵人',      icon: '💯',  check: s => s.totalKills >= 100 },
  { id: 'boss_slayer',   name: '首領終結者',    desc: '擊殺第一個首領',         icon: '👑',  check: s => s.bossKills >= 1 },
  { id: 'evolver',       name: '進化大師',      desc: '進化第一個忍者',         icon: '⚡',  check: s => s.evolutions >= 1 },
  { id: 'wealthy',       name: '土豪',          desc: '單局累計獲得1000金幣',   icon: '💰',  check: s => s.totalEarned >= 1000 },
  { id: 'untouchable',   name: '無傷過關',      desc: '以滿血完成一個關卡',     icon: '🛡️',  check: s => s.perfectLevel },
  { id: 'speedster',     name: '極速模式',      desc: '啟動2倍速模式',          icon: '⏩', check: s => s.usedSpeed2x },
  { id: 'shop_visitor',  name: '忍具屋常客',    desc: '在商店購買第一項升級',   icon: '🏪',  check: s => s.shopPurchases >= 1 },
  { id: 'grand_finale',  name: '大蛇丸的終結',  desc: '完成最終關卡',           icon: '🔥',  check: s => s.completedLevel10 },
];

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.levelIndex  = data.levelIndex ?? 0;
    this.ninjas      = [];
    this.enemies     = [];
    this.projectiles = [];
    this.selectedType = null;
    this.gameOver    = false;
    this.levelDone   = false;
    this._waveCooldown = false;
    this._popup      = null;
    this.gameSpeed   = 1;

    // Session achievement tracking
    this._session = {
      totalKills: 0, bossKills: 0, evolutions: 0,
      totalEarned: 0, perfectLevel: false,
      usedSpeed2x: false, shopPurchases: 0, completedLevel10: false,
    };
  }

  create() {
    const dpr = window.GAME_DPR || 1;
    this.cameras.main.setZoom(dpr);
    this.cameras.main.setPosition(0, 0);
    this.cameras.main.setBounds(0, 0, W, H);

    // Sound system (initialised once, resumed on first user interaction)
    this.sound = new SoundSystem();

    // Shop bonuses from persistent save
    const save = getSave();
    const shop = save.shop || {};
    this.shopBonuses = {
      attackMult:     1 + (shop.atk || 0) * 0.10,
      rangeMult:      1 + (shop.rng || 0) * 0.08,
      speedMult:      1 + (shop.spd || 0) * 0.10,
      startGoldBonus: (shop.gold || 0) * 50,
    };

    const lv        = LEVELS[this.levelIndex];
    const mapLayout = MAP_LAYOUTS[lv.layout ?? 0];

    this.grid    = new GridSystem(mapLayout.pathCells);
    this.economy = new EconomySystem(
      lv.startGold + this.shopBonuses.startGoldBonus,
      lv.maxLives,
    );
    this.waves   = new WaveSystem(this, lv.waves, mapLayout.waypoints);
    this._mapLayout = mapLayout;

    this._buildSpriteTextures();
    this._buildBackground();
    this._buildGrid();
    this._buildHUD();
    this._buildPanel();

    this.input.on('pointerdown', this._onTap, this);
    this.events.on('hudUpdate', this._refreshHUD, this);

    this._showLevelCutscene(lv);
    this._waveCountdown(3);
  }

  /* ── Level cutscene ── */
  _showLevelCutscene(lv) {
    const cx = W / 2;
    // Map layout badge
    const badge = this.add.text(cx, 95, this._mapLayout.name, {
      fontSize: '13px', fill: '#AAFFAA', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(25).setAlpha(0);

    // Story
    const story = this.add.text(cx, H / 2 - 30, lv.story, {
      fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 3, wordWrap: { width: 480 }, align: 'center',
    }).setOrigin(0.5).setDepth(25).setAlpha(0);

    // Dark overlay
    const overlay = this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.6).setDepth(24).setAlpha(0);

    this.tweens.add({ targets: [overlay, story, badge], alpha: 1, duration: 400 });
    this.tweens.add({
      targets: [overlay, story, badge], alpha: 0, delay: 2800, duration: 700,
      onComplete: () => { overlay.destroy(); story.destroy(); badge.destroy(); },
    });
  }

  /* ── Sprite textures (pixel art) ── */
  _buildSpriteTextures() {
    const SIZE = 16;
    for (const [id, rows] of Object.entries(SPRITE_PIXELS)) {
      if (this.textures.exists(id)) continue;
      const tex = this.textures.createCanvas(id, SIZE, SIZE);
      const ctx = tex.getContext();

      // Draw pixels
      for (let r = 0; r < SIZE; r++) {
        const row = rows[r] || '';
        for (let c = 0; c < SIZE; c++) {
          const col = PALETTE[row[c]];
          if (!col) continue;
          ctx.fillStyle = col;
          ctx.fillRect(c, r, 1, 1);
        }
      }

      // Auto-outline pass
      const img = ctx.getImageData(0, 0, SIZE, SIZE);
      const d   = img.data;
      const out = new Uint8ClampedArray(d.length);
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const i = (r * SIZE + c) * 4;
          if (d[i + 3] > 0) continue;
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
            if (d[(nr * SIZE + nc) * 4 + 3] > 10) {
              out[i] = 15; out[i+1] = 15; out[i+2] = 15; out[i+3] = 255;
              break;
            }
          }
        }
      }
      for (let i = 0; i < d.length; i += 4) {
        if (out[i+3] > 0 && d[i+3] === 0) {
          d[i] = out[i]; d[i+1] = out[i+1]; d[i+2] = out[i+2]; d[i+3] = out[i+3];
        }
      }
      ctx.putImageData(img, 0, 0);
      tex.refresh();
    }
  }

  /* ── Background ── */
  _buildBackground() {
    const bg = this.add.graphics().setDepth(0);

    // HUD bar
    bg.fillStyle(0x0f0500, 1);
    bg.fillRect(0, 0, W, HUD_H);
    bg.lineStyle(1, 0x553300, 1);
    bg.lineBetween(0, HUD_H, W, HUD_H);

    // Grid area — textured green
    bg.fillStyle(0x1a3a14, 1);
    bg.fillRect(0, HUD_H, GRID_RIGHT + 10, H - HUD_H);

    // Subtle grid-area texture stripes
    bg.fillStyle(0x1e4018, 0.4);
    for (let r = 0; r < GRID_ROWS; r += 2) {
      bg.fillRect(0, GRID_OFFSET_Y + r * CELL_SIZE, GRID_RIGHT + 10, CELL_SIZE);
    }

    // Right panel
    bg.fillStyle(0x0d0d0d, 1);
    bg.fillRect(PANEL_X - 10, HUD_H, W - PANEL_X + 10, H - HUD_H);

    // Divider glow
    bg.lineStyle(2, 0x333333, 1);
    bg.lineBetween(PANEL_X - 10, HUD_H, PANEL_X - 10, H);
    bg.lineStyle(1, 0x553300, 0.5);
    bg.lineBetween(PANEL_X - 9, HUD_H, PANEL_X - 9, H);
  }

  /* ── Grid ── */
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
        const x  = GRID_OFFSET_X + c * CELL_SIZE;
        const y  = GRID_OFFSET_Y + r * CELL_SIZE;
        const isPath   = this.grid.isPath(c, r);
        const occupied = this.grid.isOccupied(c, r);
        g.fillStyle(isPath ? 0x5C3D1A : occupied ? 0x0a1f0a : 0x1d4a18, 1);
        g.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        if (isPath) {
          // Path highlight edges
          g.fillStyle(0x7A5530, 0.4);
          g.fillRect(x + 1, y + 1, CELL_SIZE - 2, 2);
          g.fillRect(x + 1, y + CELL_SIZE - 3, CELL_SIZE - 2, 2);
        }

        g.lineStyle(1, isPath ? 0x3a2008 : 0x0d2b0d, 0.5);
        g.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  _drawPathArrow() {
    const pg   = this.add.graphics().setDepth(2);
    const pts  = this._mapLayout.waypoints.filter(p => p.x >= 0 && p.x <= GRID_RIGHT + 12);
    if (pts.length < 2) return;
    pg.lineStyle(3, 0xFFCC00, 0.22);
    pg.beginPath();
    pg.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => pg.lineTo(p.x, p.y));
    pg.strokePath();
  }

  /* ── HUD ── */
  _buildHUD() {
    const ts = { fontFamily: 'Arial', stroke: '#000', strokeThickness: 2 };
    this.hudGold  = this.add.text(15,  14, '', { ...ts, fontSize: '18px', fill: '#FFD700' }).setDepth(15);
    this.hudLives = this.add.text(180, 14, '', { ...ts, fontSize: '18px', fill: '#FF6666' }).setDepth(15);
    this.hudWave  = this.add.text(370, 14, '', { ...ts, fontSize: '16px', fill: '#FFFFFF' }).setDepth(15);
    this.hudLevel = this.add.text(550, 14, LEVELS[this.levelIndex].name,
      { ...ts, fontSize: '15px', fill: '#AA8855' }).setDepth(15);
    this.hudStatus = this.add.text(W - 115, 14, '',
      { ...ts, fontSize: '15px', fill: '#88FF88' }).setDepth(15);

    // 2× speed toggle
    const speedBg = this.add.rectangle(W - 55, 25, 72, 28, 0x003300)
      .setStrokeStyle(1, 0x00AA00).setDepth(15).setInteractive();
    this.speedBtnTxt = this.add.text(W - 55, 25, '▶▶ 1×',
      { fontSize: '13px', fill: '#88FF88', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(16);
    speedBg.on('pointerdown', () => this._toggleSpeed());

    this._refreshHUD();
  }

  _toggleSpeed() {
    this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
    this.time.timeScale  = this.gameSpeed;
    this.physics?.world && (this.physics.world.timeScale = 1 / this.gameSpeed);
    this.speedBtnTxt.setText(this.gameSpeed === 2 ? '⏩ 2×' : '▶▶ 1×');
    this.speedBtnTxt.setStyle({ fill: this.gameSpeed === 2 ? '#FFFF44' : '#88FF88' });
    if (this.sound) this.sound.speed();
    if (this.gameSpeed === 2) {
      this._session.usedSpeed2x = true;
      this._checkAchievements();
    }
  }

  _refreshHUD() {
    const e = this.economy;
    this.hudGold.setText(`💰 ${e.gold}`);
    this.hudLives.setText(`❤️ ${e.lives} / ${e.maxLives}`);
    this.hudWave.setText(`波次 ${this.waves.currentWave} / ${this.waves.totalWaves}`);
  }

  /* ── Right panel (ninja cards + wave controls) ── */
  _buildPanel() {
    this.add.text(PANEL_X, PANEL_TOP, '選擇忍者',
      { fontSize: '16px', fill: '#FFD700', fontFamily: 'Arial' }).setDepth(15);
    this.add.text(PANEL_X, PANEL_TOP + 20, '選擇後點擊格子放置',
      { fontSize: '11px', fill: '#666', fontFamily: 'Arial' }).setDepth(15);

    this.cards = [];
    const save = getSave();
    const unlockedMinato = (save.maxLevel ?? 1) >= 5;
    const ninjaList = Object.values(NINJA_DATA)
      .filter(n => n.alwaysUnlocked || (n.id === 'minato' && unlockedMinato));

    const startY = PANEL_TOP + 45;
    ninjaList.forEach((nd, i) => {
      const col = i % CARD_COLS;
      const row = Math.floor(i / CARD_COLS);
      const cx  = PANEL_X + col * (CARD_W + CARD_GAP);
      const cy  = startY + row * (CARD_H + CARD_GAP);
      const can = this.economy.canAfford(nd.cost);

      const bg = this.add.rectangle(cx + CARD_W / 2, cy + CARD_H / 2, CARD_W, CARD_H, 0x1a1a1a)
        .setStrokeStyle(1, can ? 0x444444 : 0x222222).setDepth(14).setInteractive();

      // Mini ninja drawing on card
      const cg = this.add.graphics().setDepth(15);
      cg.fillStyle(nd.color, 1);
      cg.fillCircle(cx + 30, cy + CARD_H / 2, 17);
      cg.lineStyle(2, 0x446688, 0.8);
      cg.beginPath();
      cg.arc(cx + 30, cy + CARD_H / 2, 17, -0.5, 0.5);
      cg.strokePath();
      // eyes
      cg.fillStyle(0x111111, 0.9);
      cg.fillCircle(cx + 25, cy + CARD_H / 2 - 3, 2.5);
      cg.fillCircle(cx + 35, cy + CARD_H / 2 - 3, 2.5);

      const nm = this.add.text(cx + 55, cy + 14, nd.name,
        { fontSize: '14px', fill: can ? '#FFFFFF' : '#555', fontFamily: 'Arial', fontStyle: 'bold' }).setDepth(15);
      const ct = this.add.text(cx + 55, cy + 34, `${nd.cost} 金`,
        { fontSize: '12px', fill: can ? '#FFD700' : '#444', fontFamily: 'Arial' }).setDepth(15);

      // Form dots
      nd.forms.forEach((_, fi) => {
        const d = this.add.graphics().setDepth(15);
        d.fillStyle(0x555555, 1);
        d.fillCircle(cx + 55 + fi * 11, cy + 55, 3.5);
      });

      bg.on('pointerdown', (p) => { p.event.stopPropagation(); this._selectType(nd.id); });
      this.cards.push({ id: nd.id, bg, nm, ct, cx, cy });
    });

    // Wave control area
    const ctrlY = startY + 2 * (CARD_H + CARD_GAP) + 18;
    this.add.text(PANEL_X, ctrlY, '波次控制',
      { fontSize: '13px', fill: '#777', fontFamily: 'Arial' }).setDepth(15);

    this.nextWaveBtn    = this.add.rectangle(PANEL_X + 80, ctrlY + 34, 160, 34, 0x004400)
      .setStrokeStyle(1, 0x00AA00).setDepth(15).setInteractive();
    this.nextWaveBtnTxt = this.add.text(PANEL_X + 80, ctrlY + 34, '▶ 下一波',
      { fontSize: '15px', fill: '#88FF88', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(16);
    this.nextWaveBtn.on('pointerdown', () => {
      if (!this.gameOver && !this.levelDone && !this.waves.active && this.waves.hasMoreWaves()) {
        this._launchWave();
      }
    });

    // Map info label
    this.add.text(PANEL_X, ctrlY + 58, `地圖：${this._mapLayout.name}`,
      { fontSize: '11px', fill: '#555', fontFamily: 'Arial' }).setDepth(15);
  }

  _selectType(id) {
    this.selectedType = id;
    this._closePopup();
    this._refreshCards();
  }

  _refreshCards() {
    for (const card of this.cards) {
      const nd  = NINJA_DATA[card.id];
      const can = this.economy.canAfford(nd.cost);
      const sel = this.selectedType === card.id;
      card.bg.setFillStyle(sel ? 0x2a2a00 : 0x1a1a1a);
      card.bg.setStrokeStyle(sel ? 2 : 1, sel ? 0xFFD700 : can ? 0x444444 : 0x222222);
      card.nm.setStyle({ fill: can ? '#FFFFFF' : '#555555' });
      card.ct.setStyle({ fill: can ? '#FFD700' : '#444444' });
    }
  }

  /* ── Input ── */
  _onTap(ptr) {
    // worldX/Y accounts for camera zoom (DPR), unlike ptr.x/y which is canvas pixels
    const wx = ptr.worldX, wy = ptr.worldY;
    if (wx > GRID_RIGHT + 5 || wy < GRID_OFFSET_Y) return;
    const cell = this.grid.pixelToGrid(wx, wy);
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

  /* ── Ninja placement ── */
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
    if (this.sound) this.sound.place();
  }

  /* ── Popup (ninja info) ── */
  _showPopup(ninja) {
    this._closePopup();
    this.selectedType = null;
    this._refreshCards();

    const PW = 300, PH = 270;
    const px = PANEL_X + 8, py = 325;
    const items = [];
    const self  = this;

    const add = (x, y, s, style) =>
      self.add.text(x, y, s, { fontFamily: 'Arial', ...style }).setDepth(22);

    const panel = this.add.rectangle(px + PW / 2, py + PH / 2, PW, PH, 0x151515, 0.97)
      .setDepth(21).setStrokeStyle(2, 0xFFD700);
    items.push(panel);

    const f       = ninja.form;
    const mult    = ninja._atkMult();
    items.push(add(px + 12, py + 10, `${ninja.data.name}・${f.name}`,
      { fontSize: '15px', fill: '#FFD700', fontStyle: 'bold' }));
    items.push(add(px + 12, py + 33, `等級 ${ninja.level}/10　攻擊 ${Math.floor(f.damage * mult)}　射程 ${Math.round(ninja._atkRange())}`,
      { fontSize: '12px', fill: '#CCC' }));
    items.push(add(px + 12, py + 51, `攻速 ${(1000 / ninja._atkCooldown()).toFixed(1)}/s`,
      { fontSize: '12px', fill: '#CCC' }));
    items.push(add(px + 12, py + 69, `忍術：${f.jutsuName}${f.jutsuIsFullMap ? '（全圖）' : ''}`,
      { fontSize: '12px', fill: '#FF8800' }));

    // Passive badges
    const passives = [];
    if (f.passiveCrit)     passives.push(`暴擊 ${(f.passiveCrit.chance * 100).toFixed(0)}%`);
    if (f.passiveAura)     passives.push('護法氣場');
    if (f.passiveTeleport) passives.push('飛雷神');
    if (f.passiveShield)   passives.push('須佐護盾');
    if (passives.length) {
      items.push(add(px + 12, py + 88, `⚡ ${passives.join('  ')}`,
        { fontSize: '11px', fill: '#AAFFAA' }));
    }

    const btnY = py + 116;

    // Level up
    const lvCost = ninja.levelUpCost();
    const canLv  = ninja.level < 10 && this.economy.canAfford(lvCost);
    items.push(this._panelBtn(px + 10, btnY, 88, 36, `升級 ${lvCost}金`,
      canLv ? 0x003388 : 0x222222, canLv ? '#88AAFF' : '#555',
      canLv ? () => {
        this.economy.spend(lvCost);
        ninja.level++;
        ninja._draw();
        this._refreshHUD();
        this._showPopup(ninja);
        if (this.sound) this.sound.coin();
      } : null));

    // Evolve
    const nf = ninja.getNextForm();
    if (nf) {
      const canEvo = ninja.level >= nf.unlockLevel && this.economy.canAfford(nf.unlockCost);
      items.push(this._panelBtn(px + 108, btnY, 88, 36, `進化 ${nf.unlockCost}金`,
        canEvo ? 0x884400 : 0x222222, canEvo ? '#FFD700' : '#555',
        canEvo ? () => {
          this.economy.spend(nf.unlockCost);
          ninja.evolve();
          this._session.evolutions++;
          this._redrawGrid();
          this._refreshHUD();
          this._showPopup(ninja);
          this._checkAchievements();
        } : null));
      if (!canEvo) items.push(add(px + 108, btnY + 40, `需Lv${nf.unlockLevel}`, { fontSize: '10px', fill: '#555' }));
    }

    // Sell
    const sv = ninja.sellValue();
    items.push(this._panelBtn(px + 206, btnY, 88, 36, `撤退 +${sv}金`,
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
        if (this.sound) this.sound.sell();
      }));

    // Close
    const closeBtn = add(px + PW - 18, py + 8, '✕', { fontSize: '18px', fill: '#FFF' }).setInteractive();
    closeBtn.on('pointerdown', (p) => { p.event.stopPropagation(); this._closePopup(); });
    items.push(closeBtn);

    this._popup = { items };
  }

  _panelBtn(x, y, w, h, label, bgColor, textColor, callback) {
    const fillStr = typeof textColor === 'number'
      ? '#' + textColor.toString(16).padStart(6, '0')
      : textColor;
    // Use plain scene objects (not Container) — avoids Phaser hit-test issues with Container children
    const cx = x + w / 2, cy = y + h / 2;
    const bg  = this.add.rectangle(cx, cy, w, h, bgColor, callback ? 1 : 0.4)
      .setStrokeStyle(1, 0x444444).setDepth(22);
    const lbl = this.add.text(cx, cy, label,
      { fontSize: '11px', fill: fillStr, fontFamily: 'Arial', align: 'center' })
      .setOrigin(0.5).setDepth(23);
    if (callback) {
      bg.setInteractive();
      bg.on('pointerdown', (p) => { p.event.stopPropagation(); callback(); });
    }
    // Return a fake "destroy-able" wrapper so popup cleanup works uniformly
    return {
      destroy() { bg.destroy(); lbl.destroy(); },
      setVisible(v) { bg.setVisible(v); lbl.setVisible(v); },
    };
  }

  _closePopup() {
    if (!this._popup) return;
    this._popup.items.forEach(i => i.destroy());
    this._popup = null;
  }

  /* ── Wave management ── */
  _waveCountdown(sec) {
    this.hudStatus.setText(`準備！${sec}秒`);
    if (sec <= 0) { this._launchWave(); return; }
    this.time.delayedCall(1000, () => this._waveCountdown(sec - 1));
  }

  _launchWave() {
    if (!this.waves.hasMoreWaves() && this.waves.currentWave > 0) return;
    this.waves.startNextWave();
    this._refreshHUD();
    this.hudStatus.setText(`第 ${this.waves.currentWave} 波`);
    this.nextWaveBtn.setVisible(false);
    this.nextWaveBtnTxt.setVisible(false);
    if (this.sound) this.sound.wave();
  }

  /* ── Update loop ── */
  update(time, delta) {
    if (this.gameOver || this.levelDone) return;

    this.waves.update(time);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(time, delta);
      if (e.isDead) {
        this.economy.addGold(e.reward);
        this.economy.onKill();
        this._session.totalKills++;
        this._session.totalEarned += e.reward;
        if (e.data.isBoss) this._session.bossKills++;
        this._refreshHUD();
        this._refreshCards();
        this._checkAchievements();
        if (this.sound) this.sound.coin();
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
    this._session.totalEarned += bonus;
    this._refreshHUD();
    this._refreshCards();
    this._toast(`波次清除！+${bonus}金`, 0x44FF88);
    this.hudStatus.setText('準備下一波...');
    this.nextWaveBtn.setVisible(true);
    this.nextWaveBtnTxt.setVisible(true);
    this.time.delayedCall(8000, () => {
      if (!this.gameOver && !this.levelDone && !this.waves.active && this.waves.hasMoreWaves())
        this._launchWave();
    });
  }

  /* ── Win / Lose ── */
  _onLevelComplete() {
    this.levelDone = true;

    const lv = LEVELS[this.levelIndex];
    this.economy.addGold(lv.completionBonus);
    this._session.totalEarned += lv.completionBonus;

    // Perfect level?
    if (this.economy.lives === this.economy.maxLives) this._session.perfectLevel = true;
    if (this.levelIndex === 9) this._session.completedLevel10 = true;

    // Persist progress
    const save = getSave();
    const next = this.levelIndex + 2;
    if (next > (save.maxLevel ?? 1)) save.maxLevel = next;
    if (lv.unlocksMinato) save.minatoUnlocked = true;

    // Merge session achievement stats into save
    save.stats = save.stats || {};
    save.stats.totalKills  = (save.stats.totalKills  || 0) + this._session.totalKills;
    save.stats.bossKills   = (save.stats.bossKills   || 0) + this._session.bossKills;
    save.stats.evolutions  = (save.stats.evolutions  || 0) + this._session.evolutions;
    save.stats.shopPurchases = (save.stats.shopPurchases || 0) + this._session.shopPurchases;
    setSave(save);

    this._checkAchievements();

    if (this.sound) this.sound.levelComplete();

    // Show shop (levelDone=true so update loop is idle)
    this._showShop(lv);
  }

  _onGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.time.timeScale = 1;
    if (this.sound) this.sound.gameOver();
    this._showEndScreen(false);
  }

  /* ── Between-level shop ── */
  _showShop(lv) {
    this._closePopup();
    const save = getSave();
    const shop = save.shop || {};

    const OW = 480, OH = 340;
    const ox = W / 2 - OW / 2;
    const oy = H / 2 - OH / 2;
    const items = [];

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setDepth(40);
    const panel   = this.add.rectangle(W / 2, H / 2, OW, OH, 0x111111, 1)
      .setStrokeStyle(2, 0xFFD700).setDepth(41);
    items.push(overlay, panel);

    const addT = (x, y, s, style) =>
      this.add.text(x, y, s, { fontFamily: 'Arial', ...style }).setDepth(42);

    items.push(addT(W / 2, oy + 22, '任務完成！升級忍具屋', {
      fontSize: '20px', fill: '#FFD700', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5));
    items.push(addT(W / 2, oy + 50, `完成獎勵 +${lv.completionBonus} 金  現有 ${this.economy.gold} 金`,
      { fontSize: '14px', fill: '#CCC', align: 'center' }).setOrigin(0.5));

    const upgrades = [
      { key: 'atk',  label: '攻擊強化',   desc: '+10% 全體攻擊', cost: 200, max: 5 },
      { key: 'rng',  label: '射程強化',   desc: '+8% 全體射程',  cost: 180, max: 5 },
      { key: 'spd',  label: '速攻強化',   desc: '+10% 攻速',     cost: 200, max: 5 },
      { key: 'gold', label: '開局金幣',   desc: '+50 開局金幣',  cost: 150, max: 8 },
    ];

    const rowH = 52;
    upgrades.forEach((u, i) => {
      const ry  = oy + 82 + i * rowH;
      const cnt = shop[u.key] || 0;
      const maxed = cnt >= u.max;
      const canBuy = !maxed && this.economy.canAfford(u.cost);

      items.push(addT(ox + 24, ry + 8,  u.label, { fontSize: '14px', fill: '#FFF', fontStyle: 'bold' }));
      items.push(addT(ox + 24, ry + 28, u.desc,  { fontSize: '12px', fill: '#AAA' }));

      // Progress dots
      for (let d = 0; d < u.max; d++) {
        const dg = this.add.graphics().setDepth(42);
        dg.fillStyle(d < cnt ? 0xFFD700 : 0x333333, 1);
        dg.fillCircle(ox + 220 + d * 13, ry + 18, 5);
        items.push(dg);
      }

      // Buy button
      const btnX = ox + OW - 90;
      const btnBg = this.add.rectangle(btnX, ry + 18, 100, 32,
        maxed ? 0x222222 : canBuy ? 0x004400 : 0x222222)
        .setStrokeStyle(1, maxed ? 0x333333 : canBuy ? 0x00AA00 : 0x333333)
        .setDepth(42);
      const btnTxt = addT(btnX, ry + 18,
        maxed ? '已滿級' : `${u.cost} 金`, {
          fontSize: '13px',
          fill: maxed ? '#555' : canBuy ? '#88FF88' : '#555',
          align: 'center',
        }).setOrigin(0.5);

      if (canBuy) {
        btnBg.setInteractive();
        btnBg.on('pointerdown', () => {
          if (!this.economy.spend(u.cost)) return;
          shop[u.key] = (shop[u.key] || 0) + 1;
          save.shop = shop;
          this._session.shopPurchases++;
          save.stats = save.stats || {};
          save.stats.shopPurchases = (save.stats.shopPurchases || 0) + 1;
          setSave(save);
          if (this.sound) this.sound.coin();
          this._checkAchievements();
          // Refresh shop
          items.forEach(item => item.destroy());
          this._showShop(lv);
        });
      }

      items.push(btnBg, btnTxt);
    });

    // Continue button
    const contY = oy + OH - 30;
    const hasNext = this.levelIndex + 1 < LEVELS.length;
    const contBg = this.add.rectangle(W / 2, contY, 200, 36, 0x003300)
      .setStrokeStyle(1, 0x00BB00).setDepth(42).setInteractive();
    const contTxt = addT(W / 2, contY, hasNext ? '下一關 ▶' : '查看結果',
      { fontSize: '16px', fill: '#88FF88', align: 'center' }).setOrigin(0.5);
    items.push(contBg, contTxt);

    contBg.on('pointerdown', () => {
      items.forEach(item => item.destroy());
      this._showEndScreen(true);
    });
    this._shopItems = items;
  }

  /* ── End screen ── */
  _showEndScreen(win) {
    this._closePopup();
    const lv = LEVELS[this.levelIndex];

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(30);

    const cx = W / 2, baseY = 170;
    this.add.text(cx, baseY, win ? '任務完成！' : '任務失敗', {
      fontSize: '42px', fill: win ? '#FFD700' : '#FF2222',
      fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(31);

    const stats = `擊殺 ${this._session.totalKills}　波數 ${this.waves.currentWave}　`;
    this.add.text(cx, baseY + 58,
      win ? `+${lv.completionBonus} 金幣　${stats}` : '木葉村陷落了...',
      { fontSize: '16px', fill: '#CCC', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(31);

    const hasNext = this.levelIndex + 1 < LEVELS.length;
    let btnY = baseY + 115;

    if (win && hasNext) {
      this._endBtn(cx, btnY, '下一關 ▶', 0x004400, '#88FF88', () => {
        this.time.timeScale = 1;
        this.scene.start('GameScene', { levelIndex: this.levelIndex + 1 });
      }); btnY += 58;
    }
    this._endBtn(cx, btnY, '再試一次', 0x440000, '#FF8888', () => {
      this.time.timeScale = 1;
      this.scene.start('GameScene', { levelIndex: this.levelIndex });
    }); btnY += 58;
    this._endBtn(cx, btnY, '主選單', 0x222222, '#FFFFFF', () => {
      this.time.timeScale = 1;
      window.showMenu();
    });
  }

  _endBtn(x, y, label, bgColor, textColor, callback) {
    const bg = this.add.rectangle(x, y, 210, 44, bgColor)
      .setStrokeStyle(1, 0x666666).setDepth(31).setInteractive();
    this.add.text(x, y, label, { fontSize: '18px', fill: textColor, fontFamily: 'Arial' })
      .setOrigin(0.5).setDepth(32);
    bg.on('pointerdown', callback);
  }

  /* ── Achievement system ── */
  _checkAchievements() {
    const save    = getSave();
    save.unlocked = save.unlocked || {};
    const stats   = save.stats || {};
    const sess    = this._session;

    // Merge session into effective stats for checking
    const effective = {
      totalKills:    (stats.totalKills  || 0) + sess.totalKills,
      bossKills:     (stats.bossKills   || 0) + sess.bossKills,
      evolutions:    (stats.evolutions  || 0) + sess.evolutions,
      totalEarned:   sess.totalEarned,
      shopPurchases: (stats.shopPurchases || 0) + sess.shopPurchases,
      perfectLevel:  sess.perfectLevel,
      usedSpeed2x:   sess.usedSpeed2x,
      completedLevel10: sess.completedLevel10,
    };

    let any = false;
    for (const ach of ACHIEVEMENTS) {
      if (!save.unlocked[ach.id] && ach.check(effective)) {
        save.unlocked[ach.id] = true;
        any = true;
        this._showAchievementToast(ach);
      }
    }
    if (any) setSave(save);
  }

  _showAchievementToast(ach) {
    const cx = GRID_RIGHT / 2;
    const bg = this.add.rectangle(cx, 120, 280, 48, 0x1a1a00, 0.95)
      .setStrokeStyle(2, 0xFFD700).setDepth(35);
    const txt = this.add.text(cx, 120,
      `🏆 成就解鎖：${ach.name}\n${ach.desc}`, {
        fontSize: '13px', fill: '#FFD700', fontFamily: 'Arial', align: 'center',
      }).setOrigin(0.5).setDepth(36);

    this.tweens.add({
      targets: [bg, txt], alpha: 0, delay: 2800, duration: 700,
      onComplete: () => { bg.destroy(); txt.destroy(); },
    });
  }

  /* ── Helpers ── */
  spawnProjectile(x, y, target, damage, opts = {}) {
    const p = new Projectile(this, x, y, target, damage, opts);
    this.projectiles.push(p);
    return p;
  }

  _toast(msg, color = 0xFFFFFF) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.add.text(GRID_RIGHT / 2, H - 28, msg, {
      fontSize: '16px', fill: hex, fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: t, y: H - 68, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }
}
