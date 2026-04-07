export class Projectile {
  constructor(scene, x, y, target, damage, opts = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = opts.speed ?? 420;
    this.color = opts.color ?? 0xFFFFFF;
    this.isJutsu = opts.isJutsu ?? false;
    this.jutsuName = opts.jutsuName ?? '';
    this.aoeRadius = opts.aoeRadius ?? 0;
    this.dotEffect = opts.dotEffect ?? null;   // { damage, ticks, interval }
    this.slowEffect = opts.slowEffect ?? null; // { factor, duration }
    this.isDone = false;

    this.gfx = scene.add.graphics().setDepth(7);
    this._draw();
  }

  _draw() {
    this.gfx.clear();
    this.gfx.fillStyle(this.color, 1);
    const r = this.isJutsu ? 7 : 4;
    this.gfx.fillCircle(this.x, this.y, r);
    if (this.isJutsu) {
      this.gfx.lineStyle(2, 0xFFFFFF, 0.6);
      this.gfx.strokeCircle(this.x, this.y, r + 3);
    }
  }

  update(_time, delta) {
    if (this.isDone) return;

    // Target gone
    if (!this.target || this.target.isDead || this.target.reachedEnd) {
      this.isDone = true;
      return;
    }

    const dt = delta / 1000;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      this._onHit();
      return;
    }

    const step = Math.min(this.speed * dt, dist);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this._draw();
  }

  _onHit() {
    this.isDone = true;

    // AOE
    if (this.aoeRadius > 0) {
      for (const e of this.scene.enemies) {
        if (e.isDead || e.reachedEnd) continue;
        const dx = e.x - this.target.x;
        const dy = e.y - this.target.y;
        if (Math.sqrt(dx * dx + dy * dy) <= this.aoeRadius) {
          this._applyHit(e);
        }
      }
    } else {
      this._applyHit(this.target);
    }

    if (this.isJutsu && this.jutsuName) {
      this._showHitText(this.jutsuName);
    }
  }

  _applyHit(enemy) {
    enemy.takeDamage(this.damage);
    if (this.slowEffect) enemy.applySlow(this.slowEffect.factor, this.slowEffect.duration);
    if (this.dotEffect) enemy.applyDot(this.dotEffect);
  }

  _showHitText(label) {
    const t = this.scene.add.text(this.x, this.y - 8, label, {
      fontSize: '13px', fill: '#FF8C00', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({ targets: t, y: this.y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  destroy() { this.gfx.destroy(); }
}
