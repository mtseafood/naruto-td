import { ENEMY_DATA } from '../data/enemyData.js';

export class Enemy {
  constructor(scene, type, waypoints) {
    this.scene = scene;
    this.type = type;
    this.data = ENEMY_DATA[type];

    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.waypoints = waypoints;
    this.wpIdx = 1; // heading toward waypoints[1]

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

    // Heal-nearby (for kabuto)
    this.healNearby = this.data.healNearby ?? null;
    this.nextHealTime = 0;

    // Phase transition (orochimaru)
    this.phased = false;

    this.gfx = scene.add.graphics().setDepth(6);
    this.hpGfx = scene.add.graphics().setDepth(9);
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
    this.gfx.clear();
    const c = this.data.isBoss ? 0xFF4444 : this.data.color;
    const innerC = this.data.color;
    const r = this.data.isBoss ? 18 : 13;

    // Outer ring for bosses
    if (this.data.isBoss) {
      this.gfx.lineStyle(2, 0xFF0000, 0.8);
      this.gfx.strokeCircle(this.x, this.y, r + 3);
    }
    this.gfx.fillStyle(innerC, 1);
    this.gfx.fillCircle(this.x, this.y, r);

    // Armored look
    if (this.armor > 0.2) {
      this.gfx.lineStyle(2, 0xCCCCCC, 0.7);
      this.gfx.strokeCircle(this.x, this.y, r - 2);
    }
  }

  _drawHpBar() {
    this.hpGfx.clear();
    const pct = Math.max(0, this.hp / this.maxHp);
    const bw = this.data.isBoss ? 40 : 26;
    const bh = this.data.isBoss ? 5 : 3;
    const bx = this.x - bw / 2;
    const by = this.y - (this.data.isBoss ? 26 : 20);

    this.hpGfx.fillStyle(0x222222, 1);
    this.hpGfx.fillRect(bx, by, bw, bh);

    const hpColor = pct > 0.6 ? 0x44FF44 : pct > 0.3 ? 0xFFAA00 : 0xFF2222;
    this.hpGfx.fillStyle(hpColor, 1);
    this.hpGfx.fillRect(bx, by, bw * pct, bh);
  }

  update(time, delta) {
    if (this.isDead || this.reachedEnd) return;

    const dt = delta / 1000;

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
        const dx = e.x - this.x, dy = e.y - this.y;
        if (Math.sqrt(dx*dx + dy*dy) <= this.healNearby.radius) {
          e.hp = Math.min(e.maxHp, e.hp + this.healNearby.amount);
        }
      }
    }

    // Phase change
    if (this.data.phaseAt && !this.phased && this.hp / this.maxHp <= this.data.phaseAt) {
      this.phased = true;
      this.speed *= 1.5;
      this._showFloatText('激怒！', 0xFF0000);
    }

    // Move toward next waypoint
    if (this.wpIdx < this.waypoints.length) {
      const target = this.waypoints[this.wpIdx];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
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
    this.nameTxt.setPosition(this.x, this.y - (this.data.isBoss ? 30 : 22));
  }

  takeDamage(rawDamage) {
    if (this.isDead) return;
    const actual = Math.max(1, Math.floor(rawDamage * (1 - this.armor)));
    this.hp -= actual;
    if (this.hp <= 0) this._die();
    else this._drawHpBar();
  }

  applySlow(factor, duration) {
    this.slowFactor = factor;
    this.slowTimer = duration;
    this.speed = this.baseSpeed * factor;
  }

  applyDot(dot) {
    this.dotDamage = dot.damage;
    this.dotTicks = dot.ticks;
    this.dotInterval = dot.interval;
    this.dotNextTick = this.scene.time.now + dot.interval;
  }

  _die() {
    this.hp = 0;
    this.isDead = true;
    this._showFloatText(`+${this.reward}`, 0xFFD700);
  }

  _showFloatText(txt, color) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.scene.add.text(this.x, this.y - 10, txt, {
      fontSize: '13px', fill: hex, fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({ targets: t, y: this.y - 55, alpha: 0, duration: 850, onComplete: () => t.destroy() });
  }

  destroy() {
    this.gfx.destroy();
    this.hpGfx.destroy();
    this.nameTxt.destroy();
  }
}
