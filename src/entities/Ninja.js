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
    this.lastJutsuTime = 0; // will be set in create so jutsu fires after half cooldown

    this.gfx = scene.add.graphics().setDepth(5);
    this.lvlTxt = null;

    this._draw();
  }

  get form() { return this.data.forms[this.formIndex]; }
  getNextForm() { return this.data.forms[this.formIndex + 1] ?? null; }

  _draw() {
    const f = this.form;
    this.gfx.clear();

    // Shadow
    this.gfx.fillStyle(0x000000, 0.3);
    this.gfx.fillEllipse(this.x, this.y + 22, 34, 8);

    // Body circle
    this.gfx.fillStyle(f.color, 1);
    this.gfx.fillCircle(this.x, this.y, 20);

    // Form ring (different per form)
    if (this.formIndex === 1) {
      this.gfx.lineStyle(2, 0xFFFFFF, 0.7);
      this.gfx.strokeCircle(this.x, this.y, 23);
    } else if (this.formIndex === 2) {
      this.gfx.lineStyle(3, 0xFFD700, 1);
      this.gfx.strokeCircle(this.x, this.y, 24);
    }

    // Level badge
    if (this.lvlTxt) this.lvlTxt.destroy();
    if (this.level > 1) {
      this.lvlTxt = this.scene.add.text(this.x + 14, this.y - 14, `${this.level}`, {
        fontSize: '10px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(6);
    }
  }

  update(time, delta, enemies) {
    const f = this.form;

    // Normal attack
    if (time - this.lastAttackTime >= f.attackCooldown) {
      const tgt = this._nearest(enemies, f.attackRange);
      if (tgt) {
        this._attack(tgt, f);
        this.lastAttackTime = time;
      }
    }

    // Jutsu (fires at half-cooldown on first use)
    const jCd = this.lastJutsuTime === 0 ? f.jutsuCooldown / 2 : f.jutsuCooldown;
    if (time - this.lastJutsuTime >= jCd) {
      const fired = this._castJutsu(f, enemies, time);
      if (fired) this.lastJutsuTime = time;
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

  _lvlBonus() { return 1 + (this.level - 1) * 0.05; }

  _attack(tgt, f) {
    const dmg = Math.floor(f.damage * this._lvlBonus());
    this.scene.spawnProjectile(this.x, this.y, tgt, dmg, {
      color: f.color, speed: 380,
    });
  }

  _castJutsu(f, enemies, _time) {
    const dmg = Math.floor(f.jutsuDamage * this._lvlBonus());

    // Heal jutsu (Sakura)
    if (f.jutsuHeal) {
      this._doHealJutsu(f);
      return true;
    }

    // Full-map attack
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
      return true;
    }

    // AOE projectile
    if (f.jutsuAoe > 0) {
      const tgt = this._nearest(enemies, f.jutsuRange);
      if (!tgt) return false;
      this.scene.spawnProjectile(this.x, this.y, tgt, dmg, {
        color: 0xFF8800, speed: 300, isJutsu: true, jutsuName: f.jutsuName,
        aoeRadius: f.jutsuAoe,
        slowEffect: f.jutsuSlow ?? null,
        dotEffect: f.jutsuDot ?? null,
      });
      return true;
    }

    // Multi-target (shadow clones etc.)
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
      return true;
    }

    // Single target jutsu
    const tgt = this._nearest(enemies, f.jutsuRange);
    if (!tgt) return false;
    this.scene.spawnProjectile(this.x, this.y, tgt, dmg, {
      color: 0xFFFFFF, speed: 300, isJutsu: true, jutsuName: f.jutsuName,
      dotEffect: f.jutsuDot ?? null,
    });
    return true;
  }

  _doHealJutsu(f) {
    const healAmt = Math.floor(f.jutsuHeal * this._lvlBonus());
    const ninjas = this.scene.ninjas;

    if (f.jutsuFullHeal) {
      // Full heal all ninjas (passive: they don't have HP in this implementation
      // so we just show the effect and maybe restore a life)
      this.scene.economy.lives = Math.min(this.scene.economy.maxLives, this.scene.economy.lives + 2);
      this.scene.events.emit('hudUpdate');
      this._showJutsuText(f.jutsuName, 210, 340, true);
      return;
    }

    // Heal nearby (aoe radius or all)
    const radius = f.jutsuRange;
    let healed = 0;
    for (const n of ninjas) {
      if (Math.hypot(n.x - this.x, n.y - this.y) <= radius) {
        healed++;
      }
    }
    // In this design ninjas don't have HP, so visual only + 1 life restore
    if (healed > 0 || ninjas.length === 0) {
      this.scene.economy.lives = Math.min(this.scene.economy.maxLives, this.scene.economy.lives + 1);
      this.scene.events.emit('hudUpdate');
      this._showJutsuText(f.jutsuName, this.x, this.y - 20, false);
    }
  }

  _showJutsuText(label, x, y, large) {
    const t = this.scene.add.text(x, y, label, {
      fontSize: large ? '22px' : '14px',
      fill: '#FF6600', fontFamily: 'Arial',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 1400, onComplete: () => t.destroy() });
  }

  evolve() {
    if (!this.getNextForm()) return false;
    this.formIndex++;
    this.lastJutsuTime = 0; // reset so jutsu fires soon
    this._draw();
    this._showJutsuText('進化！', this.x, this.y - 30, false);
    return true;
  }

  sellValue() { return Math.floor(this.data.cost * 0.5); }

  levelUpCost() { return 50 * this.level; }

  destroy() {
    this.gfx.destroy();
    if (this.lvlTxt) this.lvlTxt.destroy();
  }
}
