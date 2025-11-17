// Enemy types, spawning, and behavior
// NO IMPORTS - This file should not import player to avoid circular dependencies

/* =========================
   Enemy Types
========================= */
export const ENEMY_TYPES = {
  basic: {
    name: 'Scout',
    width: 40,
    height: 20,
    color: '#ff0000',
    health: 20,
    speed: 2.0,
    scoreValue: 10,
    behavior: null,
    canShoot: false,
    shootChance: 0,
    bulletSpeed: 0,
    bulletDamage: 0,
    burstCount: 0,
    burstDelay: 0,
    shootCooldown: 2000
  },
  tank: {
    name: 'Destroyer',
    width: 80,
    height: 40,
    color: '#00ff00',
    health: 80,
    speed: 0.8,
    scoreValue: 50,
    behavior: null,
    canShoot: true,
    shootChance: 0.008,
    bulletSpeed: -6,
    bulletDamage: 20,
    burstCount: 2,
    burstDelay: 200,
    shootCooldown: 3000
  },
  interceptor: {
    name: 'Interceptor',
    width: 50,
    height: 25,
    color: '#ff00ff',
    health: 15,
    speed: 3.5,
    scoreValue: 20,
    behavior: (enemy) => { enemy.y += Math.sin(Date.now() / 200) * 2; },
    canShoot: true,
    shootChance: 0.015,
    bulletSpeed: -10,
    bulletDamage: 8,
    burstCount: 1,
    burstDelay: 0,
    shootCooldown: 1500
  },
  bomber: {
    name: 'Bomber',
    width: 80,
    height: 40,
    color: '#0088ff',
    health: 60,
    speed: 1.2,
    scoreValue: 40,
    behavior: (enemy) => { enemy.y += Math.sin(enemy.x / 100) * 1.5; },
    canShoot: true,
    shootChance: 0.01,
    bulletSpeed: -7,
    bulletDamage: 15,
    burstCount: 3,
    burstDelay: 200,
    shootCooldown: 3000
  },
  elite: {
    name: 'Elite Fighter',
    width: 64,
    height: 32,
    color: '#ffff00',
    health: 40,
    speed: 2.5,
    scoreValue: 30,
    behavior: null,
    canShoot: true,
    shootChance: 0.012,
    bulletSpeed: -9,
    bulletDamage: 12,
    burstCount: 2,
    burstDelay: 300,
    shootCooldown: 2500
  },
  kamikaze: {
    name: 'Kamikaze',
    width: 40,
    height: 20,
    color: '#ff6600',
    health: 10,
    speed: 4.5,
    scoreValue: 25,
    // FIXED: behavior now receives player as parameter
    behavior: (enemy, player) => {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        enemy.x += (dx / dist) * enemy.speed * 0.5;
        enemy.y += (dy / dist) * enemy.speed * 0.5;
      }
      enemy.pulseTime = (enemy.pulseTime || 0) + 0.1;
    },
    canShoot: false,
    shootChance: 0,
    bulletSpeed: 0,
    bulletDamage: 0,
    burstCount: 0,
    burstDelay: 0,
    isKamikaze: true,
    explosionDamage: 35,
    shootCooldown: 0
  }
};

/* =========================
   Enemy Arrays
========================= */
export let enemies = [];
export let enemyBullets = [];

/* =========================
   Helper Functions
========================= */
export function resetEnemies() {
  enemies.length = 0;
  enemyBullets.length = 0;
}

export function clearEnemies() {
  enemies = [];
  enemyBullets = [];
}

/* =========================
   Enemy Spawning
========================= */
export function spawnEnemy(gameState) {
  // gameState should contain: bossesDefeated, cameraX, canvas, LEVEL_WIDTH, bossActive, upgradeOpen
  const { bossesDefeated, cameraX, canvas, LEVEL_WIDTH, bossActive, upgradeOpen } = gameState;
  
  if (bossActive || upgradeOpen) return;

  const difficultyMult = 1 + (bossesDefeated * 0.15);
  const speedMult = 1 + (bossesDefeated * 0.1);
  const damageMult = 1 + (bossesDefeated * 0.1);

  const kamikazeChance = Math.min(0.15, 0.02 + (bossesDefeated * 0.03));
  let chosenType;
  const roll = Math.random();

  if (roll < kamikazeChance) chosenType = 'kamikaze';
  else if (roll < 0.35) chosenType = 'basic';
  else if (roll < 0.55) chosenType = 'interceptor';
  else if (roll < 0.70) chosenType = 'elite';
  else if (roll < 0.88) chosenType = 'tank';
  else chosenType = 'bomber';

  const template = ENEMY_TYPES[chosenType];
  const x = Math.min(cameraX + canvas.width + 60 + Math.random() * 300, LEVEL_WIDTH - template.width);
  const y = 60 + Math.random() * (canvas.height - 140);

  enemies.push({
    type: chosenType,
    name: template.name,
    x,
    y,
    width: template.width,
    height: template.height,
    color: template.color,
    health: Math.floor(template.health * difficultyMult),
    speed: template.speed * speedMult,
    scoreValue: Math.floor(template.scoreValue * difficultyMult),
    behavior: template.behavior,
    canShoot: template.canShoot,
    shootChance: template.shootChance,
    bulletSpeed: template.bulletSpeed,
    bulletDamage: Math.floor(template.bulletDamage * damageMult),
    burstCount: template.burstCount,
    burstDelay: template.burstDelay,
    lastShot: 0,
    isKamikaze: template.isKamikaze || false,
    explosionDamage: template.explosionDamage ? Math.floor(template.explosionDamage * damageMult) : 0,
    pulseTime: 0,
    shootCooldown: template.shootCooldown || 2000
  });
}

/* =========================
   Enemy Shooting
========================= */
export function enemyShoot(enemy, gameState, isGameOver) {
  if (gameState !== 'playing' || isGameOver || !enemy.canShoot) return;

  for (let i = 0; i < enemy.burstCount; i++) {
    setTimeout(() => {
      if (!enemies.includes(enemy)) return;
      enemyBullets.push({
        x: enemy.x,
        y: enemy.y + enemy.height / 2,
        width: 10,
        height: 5,
        vx: enemy.bulletSpeed,
        vy: 0,
        color: '#ff4444',
        damage: enemy.bulletDamage
      });
    }, i * enemy.burstDelay);
  }
}