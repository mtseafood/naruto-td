# Naruto Tower Defense

A Naruto-themed tower defense game built with Phaser 3, designed for mobile (iPhone-first) and installable as a PWA.

## Features

- Place ninja units on a grid to defend against waves of enemies
- Economy system — earn currency to deploy and upgrade units
- Wave-based progression with increasing difficulty
- Sound system with in-game audio
- Installable as a PWA (works offline)

## Tech Stack

- [Phaser 3](https://phaser.io/) — game framework
- Vanilla JS (ES modules)
- PWA — `manifest.json` + service worker (`sw.js`)

## Project Structure

```
naruto-td/
├── index.html
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
└── src/
    ├── main.js
    ├── scenes/
    │   ├── BootScene.js
    │   ├── MenuScene.js
    │   └── GameScene.js
    ├── entities/
    │   ├── Ninja.js
    │   ├── Enemy.js
    │   └── Projectile.js
    └── systems/
        ├── GridSystem.js
        ├── WaveSystem.js
        ├── EconomySystem.js
        └── SoundSystem.js
```

## Run Locally

```bash
# Any static file server works, e.g.:
npx serve .
# then open http://localhost:3000
```

> PWA features (offline, install prompt) require HTTPS or localhost.
