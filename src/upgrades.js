// Upgrade shop, power-ups, and special abilities
import { player } from './player.js';

/* =========================
   Recover Health Upgrade
========================= */
export const RECOVER_HEALTH = {
  id: 'recover',
  name: 'Recover All Health',
  desc: 'Restore HP to max',
  cost: 500,
  apply: () => { player.health = player.maxHealth; }
};

/* =========================
   Upgrade Pool
========================= */
export const UPGRADE_POOL = [
  {
    id: 'fire_rate',
    name: 'Fire Rate Up',
    desc: 'Fire faster',
    cost: 1500,
    maxStack: 5,
    apply: () => {
      player.fireRate = Math.max(60, Math.floor(player.fireRate * 0.8));
      player._fire_rateLevel = (player._fire_rateLevel || 0) + 1; // FIXED: Added quotes/dot notation
    }
  },
  {
    id: 'proj_speed',
    name: 'Projectile Speed',
    desc: 'Bullets fly faster',
    cost: 1200,
    maxStack: 5,
    apply: () => {
      player._projSpeedInc = (player._projSpeedInc || 0) + 3;
      player._proj_speedLevel = (player._proj_speedLevel || 0) + 1; // FIXED
    }
  },
  {
    id: 'fire_spread',
    name: 'Fire Spread',
    desc: 'Fire 3-bullet spread (Combos with Double Shot!)',
    cost: 1800,
    maxStack: 1,
    apply: () => {
      player.spreadShot = true;
      player._fire_spreadLevel = (player._fire_spreadLevel || 0) + 1; // FIXED
    }
  },
  {
    id: 'double_shot',
    name: 'Double Shot',
    desc: 'Fire two bullets (Combos with Fire Spread!)',
    cost: 2000,
    maxStack: 1,
    apply: () => {
      player.doubleShot = true;
      player._double_shotLevel = (player._double_shotLevel || 0) + 1; // FIXED
    }
  },
  {
    id: 'double_damage',
    name: 'Double Damage',
    desc: 'More damage',
    cost: 2000,
    maxStack: 5,
    apply: () => {
      player.bulletDamage = Math.floor(player.bulletDamage * 1.5);
      player._double_damageLevel = (player._double_damageLevel || 0) + 1; // FIXED
    }
  },
  {
    id: 'max_health',
    name: 'Max Health Up',
    desc: '+25% Max HP',
    cost: 1500,
    maxStack: 5,
    apply: () => {
      player.maxHealth = Math.floor(player.maxHealth * 1.25);
      player.health = player.maxHealth;
      player._max_healthLevel = (player._max_healthLevel || 0) + 1; // FIXED
    }
  },
  {
    id: 'speed_boost',
    name: 'Move Speed Up',
    desc: 'Faster movement',
    cost: 1000,
    maxStack: 10,
    apply: () => {
      player.speed += 1;
      player._speed_boostLevel = (player._speed_boostLevel || 0) + 1; // FIXED
    }
  },
  {
    id: 'piercing',
    name: 'Piercing Shots',
    desc: 'Pierce enemies',
    cost: 1700,
    maxStack: 5,
    apply: () => {
      player.piercing += 1;
      player._piercingLevel = (player._piercingLevel || 0) + 1; // FIXED
    }
  },
  {
  id: 'shield_regen',
  name: 'Health Regen',
  desc: 'Regenerate HP',
  cost: 1600,
  maxStack: 5,
  apply: () => {
    player.passiveRegen = (player.passiveRegen || 0) + 2;
    player._shield_regenLevel = (player._shield_regenLevel || 0) + 1;
  }
},
  {
    id: 'buy_homing',
    name: 'Buy Homing Missiles',
    desc: 'Get 2 uses',
    cost: 1800,
    maxStack: 10,
    apply: () => {
      if (!player.powerups) player.powerups = {};
      player.powerups.homingMissiles = (player.powerups.homingMissiles || 0) + 2;
      player._buy_homingLevel = (player._buy_homingLevel || 0) + 1; // FIXED
    }
  },
  {
    id: 'buy_shield',
    name: 'Buy Shield Bubble',
    desc: 'Get 1 use',
    cost: 2500,
    maxStack: 10,
    apply: () => {
      if (!player.powerups) player.powerups = {};
      player.powerups.shieldBubble = (player.powerups.shieldBubble || 0) + 1;
      player._buy_shieldLevel = (player._buy_shieldLevel || 0) + 1; // FIXED
    }
  }
];

/* =========================
   Special Powers (Ad Rewards)
========================= */
export const SPECIAL_POWERS = [
  {
    name: 'Shield Barrier',
    apply: () => {
      player.shield = (player.shield || 0) + 100;
      return 'SHIELD BARRIER ACTIVATED!'; // ✅ Return message instead
    }
  },
  {
    name: 'Time Slow',
    apply: () => {
      player.timeSlowActive = true;
      player.timeSlowEnd = Date.now() + 30000;
      return 'TIME SLOW ACTIVATED!'; // ✅ Return message
    }
  },
  {
    name: 'Mega Damage',
    apply: () => {
      const oldDamage = player.bulletDamage;
      player.bulletDamage *= 3;
      setTimeout(() => { player.bulletDamage = oldDamage; }, 20000);
      return 'MEGA DAMAGE ACTIVATED!'; // ✅ Return message
    }
  },
  {
    name: 'Invincibility',
    apply: () => {
      player.invincible = true;
      setTimeout(() => { player.invincible = false; }, 10000);
      return 'INVINCIBILITY ACTIVATED!'; // ✅ Return message
    }
  },
  {
    name: 'Rapid Fire',
    apply: () => {
      const oldRate = player.fireRate;
      player.fireRate = Math.floor(oldRate / 4);
      setTimeout(() => { player.fireRate = oldRate; }, 25000);
      return 'RAPID FIRE ACTIVATED!'; // ✅ Return message
    }
  }
];

// Update this function too
export function applyRandomSpecialPower() {
  const power = SPECIAL_POWERS[Math.floor(Math.random() * SPECIAL_POWERS.length)];
  const message = power.apply(); // ✅ Get the message
  return { name: power.name, message }; // ✅ Return both
}

/* =========================
   Timed Power-Ups (Inventory)
========================= */
export const TIMED_POWERUPS = {
  homingMissiles: {
    name: 'Homing Missiles',
    duration: 15000,
    key: '1',
    icon: '🚀',
    apply: () => {
      player.homingMissilesActive = true;
      player.homingMissilesEnd = Date.now() + 15000;
    }
  },
  shieldBubble: {
    name: 'Shield Bubble',
    duration: 5000,
    key: '2',
    icon: '🛡️',
    apply: () => {
      player.shieldBubble = true;
      player.shieldBubbleEnd = Date.now() + 5000;
      player.invincible = true;
    }
  },
  slowTime: {
    name: 'Slow Time',
    duration: 20000,
    key: '3',
    icon: '⏱️',
    apply: () => {
      player.slowTimeActive = true;
      player.slowTimeEnd = Date.now() + 20000;
    }
  },
  ultraDamage: {
    name: 'Ultra Damage',
    duration: 15000,
    key: '4',
    icon: '💥',
    apply: () => {
      if (!player._originalDamage) player._originalDamage = player.bulletDamage;
      player.bulletDamage *= 5;
      player.ultraDamageEnd = Date.now() + 15000;
    }
  }
};

/* =========================
   Powerup Pool for Wheel
========================= */
export const powerupPool = [
  { key: 'homingMissiles', name: "Homing\nMissiles", icon: '🚀' },
  { key: 'shieldBubble', name: "Shield\nBubble", icon: '🛡️' },
  { key: 'slowTime', name: "Slow\nTime", icon: '⏱️' },
  { key: 'ultraDamage', name: "Ultra\nDamage", icon: '💥' }
];

/* =========================
   Upgrade Management
========================= */
export let currentUpgradeChoices = [];

export function openUpgradePopup(invokedAfterRevive = false, bossType = null, bossIndex = -1) {
  // Filter out maxed upgrades
  const pool = UPGRADE_POOL.filter(upgrade => {
    const key = `_${upgrade.id}Level`; // FIXED: Added backticks
    const level = player[key] || 0;
    return level < upgrade.maxStack;
  });

  const choices = [];
  while (choices.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const upgrade = pool.splice(idx, 1)[0];

    // Show stack level in name
    const level = player[`_${upgrade.id.replace(/_/g, '')}Level`] || 0;
    if (level > 0 && upgrade.maxStack > 1) {
      upgrade.displayName = `${upgrade.name} [${level}/${upgrade.maxStack}]`;
    } else {
      upgrade.displayName = upgrade.name;
    }

    choices.push(upgrade);
  }

  RECOVER_HEALTH.purchased = false;
  currentUpgradeChoices = [RECOVER_HEALTH, ...choices];

  return {
    choices: currentUpgradeChoices,
    afterRevive: invokedAfterRevive,
    bossType: bossType,
    bossIndex: bossIndex
  };
}

export function purchaseUpgradeAt(index) {
  const opt = currentUpgradeChoices[index];
  if (!opt) return { success: false, message: 'Invalid upgrade' };

  if (opt.purchased) {
    return { success: false, message: 'Already purchased!' };
  }

  if (player.score < opt.cost) {
    return { success: false, message: 'Not enough credits!' };
  }

  player.score -= opt.cost;

  try {
    opt.apply();
  } catch (err) {
    console.warn('Upgrade error', err);
    return { success: false, message: 'Upgrade failed' };
  }

  opt.purchased = true;

  // Refresh choices
  setTimeout(() => {
    refreshUpgradeChoices();
  }, 100);

  return { success: true, message: `${opt.name} purchased!` }; // FIXED: Added backticks
}

function refreshUpgradeChoices() {
  const keepRecover = currentUpgradeChoices[0];
  const unpurchased = currentUpgradeChoices.slice(1).filter(u => !u.purchased);

  const pool = UPGRADE_POOL.slice().filter(upgrade => {
    const alreadyShown = currentUpgradeChoices.some(c => c.id === upgrade.id);
    return !alreadyShown;
  });

  while (unpurchased.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    unpurchased.push(pool.splice(idx, 1)[0]);
  }

  currentUpgradeChoices = [keepRecover, ...unpurchased];
}

export function isAnyPowerupActive() {
  const powerupIds = Object.keys(TIMED_POWERUPS);
  for (let id of powerupIds) {
    const endTimeKey = id + 'End';
    if (player[endTimeKey] && Date.now() < player[endTimeKey]) {
      return TIMED_POWERUPS[id].name.replace('\n', ' ');
    }
  }
  return null;
}