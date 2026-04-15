# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Run locally

No build step — pure browser ES modules loaded from `index.html`. Serve the repo root over HTTP:

```bash
npx serve .        # or: python3 -m http.server
```

PWA features (service worker in `sw.js`, `manifest.json`) require localhost or HTTPS. There is no test suite, linter, or package.json.

## Architecture

Naruto-themed tower defense built on **Phaser 3** (loaded via CDN in `index.html`). The game is a hybrid DOM + Phaser app:

- **`index.html`** is the real entry point. It owns the DOM-based main menu (level-select grid, unlock state via `localStorage` key `naruto_td_save`), constructs the `Phaser.Game`, and exposes `window.startLevel(idx)` / `window.showMenu()` to bridge the menu and the running scene. `src/main.js` is an empty stub.
- The Phaser config registers two scenes: an idle `WaitScene` (shown while the DOM menu covers the canvas) and `GameScene`. `src/scenes/BootScene.js` and `src/scenes/MenuScene.js` exist but are **not wired up** — the DOM menu replaces `MenuScene`. Don't assume they run.
- Canvas is sized `960×640 × DPR` (capped at 2×) with `Phaser.Scale.FIT`; `window.GAME_DPR` is the global scale factor used by entities/UI code.

### Runtime structure

`GameScene` (872 lines, the bulk of game logic) is started with `{ levelIndex }` and orchestrates:

- **`src/systems/`** — `GridSystem` (tile placement), `WaveSystem` (spawn scheduling), `EconomySystem` (currency), `SoundSystem` (WebAudio SFX). Systems are plain classes instantiated per-scene.
- **`src/entities/`** — `Ninja` (towers), `Enemy`, `Projectile`. Ninjas target enemies along a path defined by the map.
- **`src/data/`** — static config: `ninjaData.js` (tower stats/upgrades), `enemyData.js`, `levels.js` (10 levels, wave composition), `maps.js` (3 map layouts with paths), `spriteData.js` (pixel-art sprite definitions drawn procedurally onto canvas textures rather than loaded as images).

### Level progression + save

Unlocks are stored as `{ maxLevel }` in `localStorage['naruto_td_save']`. When a level is completed, `GameScene` must bump `maxLevel` so the DOM menu re-renders unlocked tiles on `window.showMenu()`.

### Pixel art generator

`pixel-art-gen.html` is a standalone dev tool (not part of the game) for authoring/previewing the sprite data in `spriteData.js`.

## Conventions

- Traditional Chinese strings throughout (UI labels, level names). Preserve language when editing.
- No bundler — every import must use explicit `.js` extensions and relative paths, and new files must be reachable from `index.html`'s module graph.
- Mobile-first (iPhone). Touch input and `env(safe-area-inset-*)` are load-bearing; test layout changes at narrow viewports.
