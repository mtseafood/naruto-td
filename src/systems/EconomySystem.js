export class EconomySystem {
  constructor(startGold, maxLives) {
    this.gold = startGold;
    this.maxLives = maxLives;
    this.lives = maxLives;
    this.totalEarned = 0;
    this.totalKills = 0;
  }

  addGold(n) { this.gold += n; this.totalEarned += n; }
  canAfford(n) { return this.gold >= n; }
  spend(n) { if (!this.canAfford(n)) return false; this.gold -= n; return true; }

  loseLife(n = 1) { this.lives = Math.max(0, this.lives - n); }
  isDead() { return this.lives <= 0; }

  onKill() { this.totalKills++; }
}
