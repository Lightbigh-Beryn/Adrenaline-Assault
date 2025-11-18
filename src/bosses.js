// Boss spawning, attacks, and AI
// NO player import - will be passed as parameter to avoid circular dependency

import { enemyBullets } from './enemies.js';

/* =========================
   Boss Arrays
========================= */
export let bosses = [];
export let homingMissiles = [];

/* =========================
   Helper Functions
========================= */
export function resetBosses() {
  bosses.length = 0;
  homingMissiles.length = 0;
}

/* =========================
   Boss Spawning
========================= */
export function spawnBoss(type, optionalX, bossIndex, bossesDefeated, cameraX, canvas) {
  const isFinal = (type === 'final');
  const bossHealthMult = 1 + (bossesDefeated * 0.2);
  const width = isFinal ? 220 : 140;
  const height = isFinal ? 110 : 70;
  const baseHealth = isFinal ? 1200 : 400;
  const health = Math.floor(baseHealth * bossHealthMult);
  const bx = optionalX !== undefined ? optionalX : cameraX + canvas.width - width - 100;
  const by = Math.max(30, canvas.height / 2 - height / 2);

  bosses.push({
    id: Date.now(),
    type,
    x: bx,
    y: by,
    width: width,
    height: height,
    color: isFinal ? 'purple' : 'orange',
    health,
    maxHealth: health,
    lastShot: 0,
    lastMissile: 0,
    attackCooldown: 1500,
    missileCooldown: 3000,
    enraged: false,
    movePattern: 0,
    moveTimer: 0,
    bossIndex: bossIndex
  });
}

/* =========================
   Boss Attacks
========================= */
// FIXED: Now accepts player as parameter
export function bossConeShotAttack(boss, player) {
  const now = Date.now();
  if (now - boss.lastShot < boss.attackCooldown) return;
  boss.lastShot = now;

  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  const baseAngle = Math.atan2(dy, dx);
  const bulletCount = boss.enraged ? 7 : 5;
  const spreadAngle = boss.enraged ? 0.8 : 0.6;

  for (let i = 0; i < bulletCount; i++) {
    const angle = baseAngle + (i - Math.floor(bulletCount / 2)) * (spreadAngle / bulletCount);
    const speed = boss.enraged ? 8 : 6;
    enemyBullets.push({
      x: boss.x + boss.width / 2,
      y: boss.y + boss.height / 2,
      width: 12,
      height: 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: boss.type === 'final' ? '#ff00ff' : '#ff8800',
      damage: boss.enraged ? 25 : 20
    });
  }
}

// FIXED: Now accepts player as parameter (even though not used, for consistency)
export function bossHomingMissileAttack(boss, player) {
  const now = Date.now();
  if (now - boss.lastMissile < boss.missileCooldown) return;
  boss.lastMissile = now;

  const missileCount = boss.enraged ? 3 : 2;
  for (let i = 0; i < missileCount; i++) {
    setTimeout(() => {
      homingMissiles.push({
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height / 2,
        width: 16,
        height: 8,
        vx: -4,
        vy: 0,
        color: '#ffff00',
        damage: 30,
        homingDuration: 2000,
        homingStart: Date.now(),
        speed: boss.enraged ? 5 : 4,
        turnRate: 0.08,
        trail: []
      });
    }, i * 400);
  }
}

// FIXED: Now accepts player as parameter (even though not used, for consistency)
export function bossSpiralAttack(boss, player) {
  const now = Date.now();
  if (now - boss.lastShot < boss.attackCooldown) return;
  boss.lastShot = now;

  const bulletCount = 10;
  const rotationOffset = (Date.now() / 100) % (Math.PI * 2);

  for (let i = 0; i < bulletCount; i++) {
    const angle = (i / bulletCount) * Math.PI * 2 + rotationOffset;
    const speed = boss.enraged ? 7 : 5;
    enemyBullets.push({
      x: boss.x + boss.width / 2,
      y: boss.y + boss.height / 2,
      width: 10,
      height: 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: '#ff00ff',
      damage: boss.enraged ? 22 : 18
    });
  }
}