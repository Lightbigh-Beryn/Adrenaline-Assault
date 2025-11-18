// Player object, stats, and state management
export const player = {
x: 120,
y: 200,
width: 96,
height: 48,
speed: 8,
color: 'cyan',
health: 200,
maxHealth: 200,
bullets: [],
fireRate: 180,
lastShot: 0,
bulletDamage: 10,
piercing: 0,
doubleShot: false,
spreadShot: false,
score: 0,
scoreMultiplier: 1,
passiveRegen: 0,
drone: false,
homingMissileFireRate: 400,
homingMissileDamage: 25,
lastHomingShot: 0,
iframeActive: false,
iframeEnd: 0,
// Stats tracking for battle summary
stats: {
shotsHit: 0,
shotsFired: 0,
damageDealt: 0,
damageTaken: 0,
enemiesKilled: 0,
bossesDefeated: 0,
creditsEarned: 0,
// Per-enemy-type tracking
enemyKills: {
  basic: 0,
  tank: 0,
  interceptor: 0,
  bomber: 0,
  elite: 0,
  kamikaze: 0
}
}
};
// Initialize powerups inventory
if (!player.powerups) player.powerups = {};
// Round statistics
export let roundStats = {
startTime: 0,
endTime: 0,
duration: 0,
finalScore: 0
};
export function resetRoundStats() {
player.stats = {
shotsHit: 0,
shotsFired: 0,
damageDealt: 0,
damageTaken: 0,
enemiesKilled: 0,
bossesDefeated: 0,
creditsEarned: 0,
enemyKills: {
basic: 0,
tank: 0,
interceptor: 0,
bomber: 0,
elite: 0,
kamikaze: 0
}
};
roundStats = {
startTime: Date.now(),
endTime: 0,
duration: 0,
finalScore: player.score
};
}
export function calculatePerformanceRating(accuracy, duration, damageTaken) {
let score = 0;
// Accuracy component (0-40 points)
if (accuracy >= 80) score += 40;
else if (accuracy >= 60) score += 30;
else if (accuracy >= 40) score += 20;
else score += 10;
// Speed component (0-30 points) - faster is better
if (duration <= 120) score += 30;
else if (duration <= 180) score += 20;
else if (duration <= 240) score += 10;
// Survival component (0-30 points) - less damage is better
if (damageTaken <= 200) score += 30;
else if (damageTaken <= 400) score += 20;
else if (damageTaken <= 600) score += 10;
// Rating thresholds
if (score >= 85) return 'S';
if (score >= 70) return 'A';
if (score >= 50) return 'B';
if (score >= 30) return 'C';
return 'D';
}