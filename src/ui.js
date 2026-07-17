// Barrel file - re-exports the split UI modules so existing imports
// (e.g. `import { drawHealthBar, drawTitleScreen } from './ui.js'`) keep working
// unchanged elsewhere in the project.
//
// Actual code lives in:
//   ui-screens.js  - canvas setup, loading/title/countdown/pause screens, flash messages
//   ui-hud.js      - health bar, upgrades display, powerup hotbar, boss bar, overlays
//   ui-entities.js - in-world rendering: enemies, bosses, player, projectiles

export * from './ui-screens.js';
export * from './ui-hud.js';
export * from './ui-entities.js';
