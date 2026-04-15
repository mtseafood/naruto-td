import { NINJA_DATA } from '../data/ninjaData.js';

export class Ninja {
  constructor(scene, col, row, type) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.type = type;
    this.data = NINJA_DATA[type];
    this.formIndex = 0;
    this.level = 1;

    const center = scene.grid.cellCenter(col, row);
    this.x = center.x;
    this.y = center.y;

    this.lastAttackTime = 0;
    this.lastJutsuTime  = 0;
    this.lastAuraTime   = 0;

    this._synergyBonus = 0; // set by GameScene._updateSynergies()

    this.sprite   = null;
    this.gfx      = scene.add.graphics().setDepth(7);
    this.jutsuGfx = scene.add.graphics().setDepth(9);
    this.lvlTxt   = null;

    this._draw();
  }

  get form() { return this.data.forms[this.formIndex]; }
  getNextForm() { return this.data.forms[this.formIndex + 1] ?? null; }

  _draw() {
    const f = this.form;
    const g = this.gfx;
    g.clear();

    // Destroy old sprite before redrawing (e.g. on evolve)
    if (this.sprite) { this.sprite.destroy(); this.sprite = null; }

    // ── Pixel art sprite ──────────────────────────────────
    if (this.scene.textures.exists(this.type)) {
      // Shadow ellipse
      g.fillStyle(0x000000, 0.28);
      g.fillEllipse(this.x, this.y + 22, 38, 9);

      this.sprite = this.scene.add.image(this.x, this.y - 2, this.type)
        .setDisplaySize(44, 44)
        .setDepth(5);
    } else {
      // Fallback: plain circle
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(this.x, this.y + 23, 36, 8);
      g.fillStyle(f.color, 1);
      g.fillCircle(this.x, this.y, 20);
    }

    // Form ring
    if (this.formIndex === 1) {
      g.lineStyle(2, 0xFFFFFF, 0.8);
      g.strokeCircle(this.x, this.y - 2, 25);
    } else if (this.formIndex === 2) {
      g.lineStyle(3, 0xFFD700, 1);
      g.strokeCircle(this.x, this.y - 2, 26);
      g.lineStyle(1, 0xFFFFAA, 0.5);
      g.strokeCircle(this.x, this.y - 2, 21);
    }

    // Aura ring (passive)
    if (f.passiveAura) {
      g.lineStyle(1, 0xFFAA00, 0.25);
      g.strokeCircle(this.x, this.y, f.passiveAura.radius);
    }

    // Level badge
    if (this.lvlTxt) this.lvlTxt.destroy();
    if (this.level > 1) {
      this.lvlTxt = this.scene.add.text(this.x + 16, this.y - 18, `${this.level}`, {
        fontSize: '10px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(8);
    }
  }

  update(time, delta, enemies) {
    const f = this.form;

    // Normal attack
    const atkCd = this._atkCooldown();
    if (time - this.lastAttackTime >= atkCd) {
      const tgt = this._nearest(enemies, this._atkRange());
      if (tgt) {
        this._attack(tgt, f);
        this.lastAttackTime = time;
      }
    }

    // Jutsu
    const jCd = this.lastJutsuTime === 0 ? f.jutsuCooldown / 2 : f.jutsuCooldown;
    if (time - this.lastJutsuTime >= jCd) {
      const fired = this._castJutsu(f, enemies, time);
      if (fired) this.lastJutsuTime = time;
    }

    // Jutsu cooldown arc
    this._drawJutsuCooldown(time);

    // Aura passive — debuff nearby enemies' armor
    if (f.passiveAura && time - this.lastAuraTime >= 1000) {
      this.lastAuraTime = time;
      for (const e of enemies) {
        if (e.isDead || e.reachedEnd) continue;
        if (Math.hypot(e.x - this.x, e.y - this.y) <= f.passiveAura.radius) {
          e.applyArmorDebuff(f.passiveAura.defenseBonus);
        }
      }
    }
  }

  _nearest(enemies, range) {
    let best = null, bestDist = Infinity;
    for (const e of enemies) {
      if (e.isDead || e.reachedEnd) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= range && d < bestDist) { best = e; bestDist = d; }
    }
    return best;
  }

  _drawJutsuCooldown(time) {
    const g  = this.jutsuGfx;
    g.clear();
    const f   = this.form;
    const cd  = f.jutsuCooldown;
    const eff = this.lastJutsuTime === 0 ? cd / 2 : cd;
    const pct = Math.min(1, (time - this.lastJutsuTime) / eff);
    const r   = 28;
    const cx  = this.x, cy = this.y - 2;

    if (pct >= 1) {
      // Pulsing glow: jutsu ready
      const alpha = 0.35 + 0.25 * Math.sin(time * 0.005);
      g.lineStyle(2, 0xFFFF00, alpha);
      g.strokeCircle(cx, cy, r);
    } else {
      // Sweep arc showing charge
      g.lineStyle(2, 0xFF8800, 0.55);
      const startAngle = -Math.PI / 2;
      const endAngle   = startAngle + pct * Math.PI * 2;
      g.beginPath();
      g.arc(cx, cy, r, startAngle, endAngle, false);
      g.strokePath();
    }
  }

  // Shop/level bonuses
  _atkMult()    { return (1 + (this.level - 1) * 0.05) * (this.scene.shopBonuses?.attackMult ?? 1) * (1 + this._synergyBonus); }
  _atkRange()   { return this.form.attackRange  * (this.scene.shopBonuses?.rangeMult ?? 1); }
  _jutsuRange() { return this.form.jutsuRange   * (this.scene.shopBonuses?.rangeMult ?? 1); }
  _atkCooldown(){ return this.form.attackCooldown / (this.scene.shopBonuses?.speedMult ?? 1); }

  _attack(tgt, f) {
    let dmg = Math.floor(f.damage * this._atkMult());
    // Crit passive
    if (f.passiveCrit && Math.random() < f.passiveCrit.chance) {
      dmg *= 2;
      this._showJutsuText('暴擊！', tgt.x, tgt.y - 15, false);
    }
    this.scene.spawnProjectile(this.x, this.y, tgt, dmg, {
      color: f.color, speed: 380,
    });
    if (this.scene.sound) this.scene.sound.attack();
  }

  _castJutsu(f, enemies, _time) {
    const dmg = Math.floor(f.jutsuDamage * this._atkMult());

    if (f.jutsuHeal) {
      this._doHealJutsu(f);
      return true;
    }

    if (f.jutsuIsFullMap) {
      let hit = 0;
      for (const e of enemies) {
        if (e.isDead || e.reachedEnd) continue;
        e.takeDamage(dmg);
        if (f.jutsuSlow) e.applySlow(f.jutsuSlow.factor, f.jutsuSlow.duration);
        hit++;
      }
      if (hit === 0) return false;
      this._showJutsuText(f.jutsuName, 210, 340, true);
      if (this.scene.sound) this.scene.sound.jutsu();
      this._spawnJutsuParticles(f.color);
      return true;
    }

    if (f.jutsuAoe > 0) {
      const tgt = this._nearest(enemies, this._jutsuRange());
      if (!tgt) return false;
      this.scene.spawnProjectile(this.x, this.y, tgt, dmg, {
        color: 0xFF8800, speed: 300, isJutsu: true, jutsuName: f.jutsuName,
        aoeRadius: f.jutsuAoe,
        slowEffect: f.jutsuSlow ?? null,
        dotEffect: f.jutsuDot ?? null,
      });
      if (this.scene.sound) this.scene.sound.jutsu();
      return true;
    }

    if (f.jutsuTargetCount > 1) {
      const pool = enemies.filter(e => !e.isDead && !e.reachedEnd);
      if (pool.length === 0) return false;
      const count = Math.min(f.jutsuTargetCount, pool.length);
      for (let i = 0; i < count; i++) {
        const t = pool[Math.floor(Math.random() * pool.length)];
        this.scene.spawnProjectile(this.x, this.y, t, Math.floor(dmg * 0.6), {
          color: f.color, speed: 340, isJutsu: i === 0,
          jutsuName: i === 0 ? f.jutsuName : '',
        });
      }
      if (this.scene.sound) this.scene.sound.jutsu();
      return true;
    }

    const tgt = this._nearest(enemies, this._jutsuRange());
    if (!tgt) return false;
    this.scene.spawnProjectile(this.x, this.y, tgt, dmg, {
      color: 0xFFFFFF, speed: 300, isJutsu: true, jutsuName: f.jutsuName,
      dotEffect: f.jutsuDot ?? null,
    });
    if (this.scene.sound) this.scene.sound.jutsu();
    return true;
  }

  _doHealJutsu(f) {
    const healAmt = Math.floor(f.jutsuHeal * this._atkMult());

    if (f.jutsuFullHeal) {
      this.scene.economy.lives = Math.min(this.scene.economy.maxLives, this.scene.economy.lives + 2);
      this.scene.events.emit('hudUpdate');
      this._showJutsuText(f.jutsuName, 210, 340, true);
      return;
    }

    const radius = f.jutsuRange;
    let healed = 0;
    for (const n of this.scene.ninjas) {
      if (Math.hypot(n.x - this.x, n.y - this.y) <= radius) healed++;
    }
    if (healed > 0 || this.scene.ninjas.length === 0) {
      this.scene.economy.lives = Math.min(this.scene.economy.maxLives, this.scene.economy.lives + 1);
      this.scene.events.emit('hudUpdate');
      this._showJutsuText(f.jutsuName, this.x, this.y - 20, false);
    }
  }

  _spawnJutsuParticles(color) {
    const g = this.scene.add.graphics().setDepth(11);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      g.fillStyle(color, 0.8);
      g.fillCircle(
        this.x + Math.cos(angle) * 15,
        this.y + Math.sin(angle) * 15,
        4,
      );
    }
    this.scene.tweens.add({
      targets: g, alpha: 0, scaleX: 2, scaleY: 2, duration: 500,
      onComplete: () => g.destroy(),
    });
  }

  _showJutsuText(label, x, y, large) {
    const t = this.scene.add.text(x, y, label, {
      fontSize: large ? '22px' : '14px',
      fill: '#FF6600', fontFamily: 'Arial',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: t, y: y - 70, alpha: 0, duration: 1400,
      onComplete: () => t.destroy(),
    });
  }

  evolve() {
    if (!this.getNextForm()) return false;
    this.formIndex++;
    this.lastJutsuTime = 0;
    this._draw();
    this._showJutsuText('進化！', this.x, this.y - 30, false);
    this._spawnEvolveParticles();
    if (this.scene.sound) this.scene.sound.evolve();
    return true;
  }

  _spawnEvolveParticles() {
    for (let i = 0; i < 10; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = 15 + Math.random() * 20;
      const g = this.scene.add.graphics().setDepth(12);
      g.fillStyle(0xFFD700, 1);
      g.fillCircle(this.x + Math.cos(angle) * 10, this.y + Math.sin(angle) * 10, 3);
      this.scene.tweens.add({
        targets: g,
        x: g.x + Math.cos(angle) * radius,
        y: g.y + Math.sin(angle) * radius,
        alpha: 0,
        duration: 500 + Math.random() * 300,
        onComplete: () => g.destroy(),
      });
    }
  }

  sellValue()    { return Math.floor(this.data.cost * 0.5); }
  levelUpCost()  { return 50 * this.level; }

  destroy() {
    this.gfx.destroy();
    this.jutsuGfx.destroy();
    if (this.sprite) this.sprite.destroy();
    if (this.lvlTxt) this.lvlTxt.destroy();
  }
}
