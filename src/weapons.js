
// Player shooting, collision detection, and projectile logic
import { player } from './player.js';
import { enemies, enemyBullets } from './enemies.js';
import { bosses, homingMissiles } from './bosses.js';
/* =========================
Collision Helper
========================= */
export function aabbCollide(a, b) {
return a && b && a.x < b.x + b.width && a.x + a.width > b.x &&
a.y < b.y + b.height && a.y + a.height > b.y;
}
/* =========================
Player Shooting
========================= */
export function attemptShoot(isGameOver, adPlaying, upgradeOpen, isPaused) {
if (isGameOver || adPlaying || upgradeOpen || isPaused) return;
const now = Date.now();
// Combo fire rate penalty
const comboFireRatePenalty = (player.spreadShot && player.doubleShot) ? 1.2 : 1;
const effectiveFireRate = player.fireRate * comboFireRatePenalty;
if (now - player.lastShot < effectiveFireRate) return;
player.lastShot = now;
const baseX = player.x + player.width;
const baseY = player.y + player.height / 2;
const projSpeedBoost = player._projSpeedInc || 0;
// Homing missiles mode
if (player.homingMissilesActive) {
if (now - player.lastHomingShot < player.homingMissileFireRate) return;
player.lastHomingShot = now;
// Find nearest enemy
let nearestEnemy = null;
let minDist = Infinity;

enemies.forEach(e => {
  const dist = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
  if (dist < minDist) {
    minDist = dist;
    nearestEnemy = e;
  }
});

// Also check bosses
bosses.forEach(b => {
  const dist = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
  if (dist < minDist) {
    minDist = dist;
    nearestEnemy = b;
  }
});

// Only fire if target exists
if (!nearestEnemy) return;

// Fire homing missile toward target
const targetAngle = Math.atan2(nearestEnemy.y - baseY, nearestEnemy.x - baseX);

homingMissiles.push({
  x: baseX,
  y: baseY,
  width: 16,
  height: 8,
  vx: Math.cos(targetAngle) * 8,
  vy: Math.sin(targetAngle) * 8,
  color: '#00ffff',
  damage: player.homingMissileDamage,
  homingDuration: 3000,
  homingStart: Date.now(),
  speed: 8,
  turnRate: 0.15,
  trail: [],
  isPlayerMissile: true,
  pierce: player.piercing
});

player.stats.shotsFired++;
return;
}
const addBullet = (x, y, vx, vy, dmg) => {
player.bullets.push({
x, y, width: 12, height: 6, vx, vy, color: 'yellow',
damage: dmg, pierce: player.piercing
});
player.stats.shotsFired++;
const newBullet = player.bullets[player.bullets.length - 1];
newBullet.length = 40;
};
// Combo: spread + double shot
if (player.spreadShot && player.doubleShot) {
const comboDamage = Math.floor(player.bulletDamage * 0.7);
addBullet(baseX, baseY - 8, 14 + projSpeedBoost, -2, comboDamage);
addBullet(baseX, baseY - 8, 16 + projSpeedBoost, 0, comboDamage);
addBullet(baseX, baseY - 8, 14 + projSpeedBoost, 2, comboDamage);
addBullet(baseX, baseY + 8, 14 + projSpeedBoost, -2, comboDamage);
addBullet(baseX, baseY + 8, 16 + projSpeedBoost, 0, comboDamage);
addBullet(baseX, baseY + 8, 14 + projSpeedBoost, 2, comboDamage);
} else if (player.spreadShot) {
addBullet(baseX, baseY, 14 + projSpeedBoost, -2, player.bulletDamage);
addBullet(baseX, baseY, 16 + projSpeedBoost, 0, player.bulletDamage);
addBullet(baseX, baseY, 14 + projSpeedBoost, 2, player.bulletDamage);
} else if (player.doubleShot) {
addBullet(baseX, baseY - 8, 16 + projSpeedBoost, 0, player.bulletDamage);
addBullet(baseX, baseY + 8, 16 + projSpeedBoost, 0, player.bulletDamage);
} else {
addBullet(baseX, baseY, 16 + projSpeedBoost, 0, player.bulletDamage);
}
}
/* =========================
Hit Sparks System
========================= */
export let hitSparks = [];
export function createHitSpark(x, y, color) {
hitSparks.push({
x: x,
y: y,
color: color,
life: 8,
maxLife: 8
});
}
export function updateHitSparks() {
for (let i = hitSparks.length - 1; i >= 0; i--) {
hitSparks[i].life--;
if (hitSparks[i].life <= 0) {
hitSparks.splice(i, 1);
}
}
}