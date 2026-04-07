import { Enemy } from '../entities/Enemy.js';

export class WaveSystem {
  constructor(scene, waves, path) {
    this.scene = scene;
    this.waves = waves;
    this.path = path;

    this.currentWave = 0;       // 1-based after first startNextWave()
    this.totalWaves = waves.length;

    this.active = false;        // currently spawning
    this.spawnDone = false;     // all enemies for this wave spawned
    this.waveStartTime = 0;
    this.spawnQueue = [];
    this.queueIdx = 0;
  }

  startNextWave() {
    if (this.currentWave >= this.totalWaves) return;
    const waveData = this.waves[this.currentWave];
    this.currentWave++;
    this.active = true;
    this.spawnDone = false;
    this.waveStartTime = this.scene.time.now;
    this.queueIdx = 0;

    // Flatten groups into a sorted spawn queue
    this.spawnQueue = [];
    for (const g of waveData.groups) {
      for (let i = 0; i < g.count; i++) {
        this.spawnQueue.push({ type: g.type, time: g.startDelay + i * g.interval });
      }
    }
    this.spawnQueue.sort((a, b) => a.time - b.time);
  }

  update(time) {
    if (!this.active || this.spawnDone) return;

    const elapsed = time - this.waveStartTime;
    while (this.queueIdx < this.spawnQueue.length && elapsed >= this.spawnQueue[this.queueIdx].time) {
      const e = new Enemy(this.scene, this.spawnQueue[this.queueIdx].type, this.path);
      this.scene.enemies.push(e);
      this.queueIdx++;
    }

    if (this.queueIdx >= this.spawnQueue.length) {
      this.spawnDone = true;
      this.active = false;
    }
  }

  // True when spawning finished AND all enemies are gone
  isWaveClear(enemies) {
    return this.spawnDone && enemies.length === 0;
  }

  hasMoreWaves() { return this.currentWave < this.totalWaves; }
}
