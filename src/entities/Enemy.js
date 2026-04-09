import { ENEMY_DATA } from '../data/enemyData.js';

export class Enemy {
  constructor(scene, type, waypoints) {
    this.scene = scene;
    this.type = type;
    this.data = ENEMY_DATA[type];

    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.waypoints = waypoints;
    this.wpIdx = 1;

    this.hp = this.data.hp;
    this.maxHp = this.data.hp;
    this.baseSpeed = this.data.speed;
    this.speed = this.baseSpeed;
    this.reward = this.data.reward;
    this.damage = this.data.damage ?? 1;
    this.armor = this.data.armor ?? 0;

    this.isDead = false;
    this.reachedEnd = false;

    // Status effects
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.dotTimer = 0;
    this.dotDamage = 0;
    this.dotTicks = 0;
    this.dotInterval = 0;
    this.dotNextTick = 0;

    // Armor debuff (from aura passives)
    this.armorDebuff = 0;

    // Heal-nearby (kabuto)
    this.healNearby = this.data.healNearby ?? null;
    this.nextHealTime = 0;

    // Phase transition (orochimaru)
    this.phased = false;

    // Bobbing animation
    this._bobT = Math.random() * Math.PI * 2; // random phase offset

    this.gfx    = scene.add.graphics().setDepth(6);
    this.hpGfx  = scene.add.graphics().setDepth(9);
    this.nameTxt = scene.add.text(this.x, this.y - 30, this.data.name, {
      fontSize: '9px', fill: '#FFFFFF', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(10);

    if (this.data.isBoss) {
      this.nameTxt.setStyle({ fontSize: '11px', fill: '#FF4444' });
    }

    this._draw();
  }

  _draw() {
    const g = this.gfx;
    g.clear();

    const isBoss  = this.data.isBoss;
    const r       = isBoss ? 18 : 13;
    const bodyC   = this.data.color;
    const bob     = Math.sin(this._bobT) * 2; // vertical bob offset

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(this.x, this.y + r + 2 - bob, r * 2 - 4, 5);

    // Boss outer ring
    if (isBoss) {
      g.lineStyle(2, 0xFF0000, 0.75);
      g.strokeCircle(this.x, this.y - bob, r + 4);
    }

    // Body
    g.fillStyle(bodyC, 1);
    g.fillCircle(this.x, this.y - bob, r);

    // Armor ring
    if (this.armor > 0.2) {
      g.lineStyle(2, 0xCCCCCC, 0.7);
      g.strokeCircle(this.x, this.y - bob, r - 2);
    }

    // Eyes (two small white dots + pupils)
    const ex = r * 0.3;
    const ey = r * 0.15;
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillCircle(this.x - ex, this.y - ey - bob, isBoss ? 4 : 3);
    g.fillCircle(this.x + ex, this.y - ey - bob, isBoss ? 4 : 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(this.x - ex + 1, this.y - ey - bob + 0.5, isBoss ? 2 : 1.5);
    g.fillCircle(this.x + ex + 1, this.y - ey - bob + 0.5, isBoss ? 2 : 1.5);

    // Slow: blue tint outline
    if (this.slowFactor < 1) {
      g.lineStyle(2, 0x66CCFF, 0.7);
      g.strokeCircle(this.x, this.y - bob, r + 2);
    }
  }

  _drawHpBar() {
    const hg = this.hpGfx;
    hg.clear();
    const pct  = Math.max(0, this.hp / this.maxHp);
    const isBoss = this.data.isBoss;
    const bw   = isBoss ? 40 : 28;
    const bh   = isBoss ? 5 : 3;
    const bob  = Math.sin(this._bobT) * 2;
    const bx   = this.x - bw / 2;
    const by   = this.y - (isBoss ? 28 : 22) - bob;

    hg.fillStyle(0x111111, 1);
    hg.fillRect(bx, by, bw, bh);

    const hpColor = pct > 0.6 ? 0x33DD33 : pct > 0.3 ? 0xFFAA00 : 0xFF2222;
    hg.fillStyle(hpColor, 1);
    hg.fillRect(bx, by, bw * pct, bh);
  }

  update(time, delta) {
    if (this.isDead || this.reachedEnd) return;

    const dt = delta / 1000;

    // Advance bob animation
    this._bobT += dt * 4.5;

    // Slow timer
    if (this.slowTimer > 0) {
      this.slowTimer -= delta;
      if (this.slowTimer <= 0) { this.slowFactor = 1; this.speed = this.baseSpeed; }
    }

    // DoT
    if (this.dotTicks > 0 && time >= this.dotNextTick) {
      this.hp -= this.dotDamage;
      this.dotTicks--;
      this.dotNextTick = time + this.dotInterval;
      if (this.hp <= 0) { this._die(); return; }
    }

    // Heal nearby (kabuto)
    if (this.healNearby && time >= this.nextHealTime) {
      this.nextHealTime = time + this.healNearby.interval;
      for (const e of this.scene.enemies) {
        if (e === this || e.isDead) continue;
        if (Math.hypot(e.x - this.x, e.y - this.y) <= this.healNearby.radius) {
          e.hp = Math.min(e.maxHp, e.hp + this.healNearby.amount);
        }
      }
    }

    // Phase transition
    if (this.data.phaseAt && !this.phased && this.hp / this.maxHp <= this.data.phaseAt) {
      this.phased = true;
      this.speed *= 1.5;
      this._showFloatText('激怒！', 0xFF0000);
    }

    // Move
    if (this.wpIdx < this.waypoints.length) {
      const target = this.waypoints[this.wpIdx];
      const dx   = target.x - this.x;
      const dy   = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = Math.min(this.speed * dt, dist);
      if (dist < 4) {
        this.wpIdx++;
        if (this.wpIdx >= this.waypoints.length) { this.reachedEnd = true; return; }
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
    }

    this._draw();
    this._drawHpBar();
    this.nameTxt.setPosition(this.x, this.y - (this.data.isBoss ? 32 : 23) - Math.sin(this._bobT) * 2);
  }

  takeDamage(rawDamage) {
    if (this.isDead) return;
    const effectiveArmor = Math.max(0, this.armor - this.armorDebuff);
    const actual = Math.max(1, Math.floor(rawDamage * (1 - effectiveArmor)));
    this.hp -= actual;
    if (this.hp <= 0) this._die();
    else this._drawHpBar();
  }

  applySlow(factor, duration) {
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowTimer  = Math.max(this.slowTimer, duration);
    this.speed      = this.baseSpeed * this.slowFactor;
  }

  applyDot(dot) {
    this.dotDamage   = dot.damage;
    this.dotTicks    = dot.ticks;
    this.dotInterval = dot.interval;
    this.dotNextTick = this.scene.time.now + dot.interval;
  }

  applyArmorDebuff(amount) {
    this.armorDebuff = Math.min(this.armor, Math.max(this.armorDebuff, amount));
  }

  _die() {
    this.hp = 0;
    this.isDead = true;
    this._spawnDeathParticles();
    this._showFloatText(`+${this.reward}`, 0xFFD700);
    if (this.scene.sound) this.scene.sound.death();
  }

  _spawnDeathParticles() {
    const g     = this.scene.add.graphics().setDepth(12);
    const color = this.data.color;
    const r     = this.data.isBoss ? 18 : 13;

    // Flash ring
    g.lineStyle(3, color, 1);
    g.strokeCircle(this.x, this.y, r);
    g.fillStyle(0xFFFFFF, 0.6);
    g.fillCircle(this.x, this.y, r * 0.8);

    this.scene.tweens.add({
      targets: g, alpha: 0, duration: 350,
      onComplete: () => g.destroy(),
    });

    // 6 debris dots flying outward
    const count = this.data.isBoss ? 8 : 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist  = 20 + Math.random() * 25;
      const dot   = this.scene.add.graphics().setDepth(11);
      dot.fillStyle(color, 1);
      dot.fillCircle(this.x, this.y, 3);
      this.scene.tweens.add({
        targets: dot,
        x: dot.x + Math.cos(angle) * dist,
        y: dot.y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 300 + Math.random() * 200,
        onComplete: () => dot.destroy(),
      });
    }
  }

  _showFloatText(txt, color) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.scene.add.text(this.x, this.y - 10, txt, {
      fontSize: '13px', fill: hex, fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: t, y: this.y - 55, alpha: 0, duration: 850,
      onComplete: () => t.destroy(),
    });
  }

  destroy() {
    this.gfx.destroy();
    this.hpGfx.destroy();
    this.nameTxt.destroy();
  }
}
