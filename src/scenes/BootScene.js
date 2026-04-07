export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    // No assets to load — all graphics are procedural
    // Just hand off to menu immediately
    this.scene.start('MenuScene');
  }
}
