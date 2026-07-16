
// All game constants and configuration settings
export const GAME_CONFIG = {
  LEVEL_WIDTH: 18000,
  BASE_SCROLL_SPEED: 1.5,
  ENEMY_SPAWN_MS: 900,
  AD_REVIVE_SECONDS: 3,
  AD_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 hours
  IFRAME_DURATION_MS: 3000, // 3 seconds of invulnerability after hit
  IFRAME_ENABLED: true,

  // "Disoriented" state — runs for the same duration as the invincibility window.
  // Currently just a mild fire-rate penalty (directly targets "hits = free damage
  // time" without touching survivability). Knockback + movement slow are wired up
  // and ready to go, just dialed to zero for now — re-enable by raising
  // KNOCKBACK_FORCE and lowering DISORIENT_SPEED_MULT once this has been playtested.
  DISORIENT_SPEED_MULT: 1,      // 1 = no movement penalty (for now)
  DISORIENT_FIRERATE_MULT: 1.6, // multiplies fire-rate cooldown (bigger = slower firing)
  KNOCKBACK_FORCE: 0,           // 0 = no knockback (for now)
  KNOCKBACK_DECAY: 0.88,        // per-frame decay of knockback velocity (once force > 0)

  ROUND_LENGTH: 18000,
  AD_BOSS_COOLDOWN_MS: 24 * 60 * 60 * 1000 // 24 hours for boss ads
};

export const CANVAS_CONFIG = {
  width: 1152,
  height: 648
};

export const HOTBAR_CONFIG = {
  SLOT_SIZE: 48,
  SPACING: 12,
  BOTTOM_MARGIN: 15
};

// Boss trigger positions - FUNCTION to avoid mutation issues
export const createBossTriggers = () => [
  { cameraX: 5000, type: 'mini', spawned: false, index: 0 },
  { cameraX: 10000, type: 'mini', spawned: false, index: 1 },
  { cameraX: 15000, type: 'final', spawned: false, index: 2 }
];

// Device detection (reliable for 2025 mobile browsers)
export const isTouchDevice = () => {
  return (
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
};

export const isMobileDevice = () => {
  // Only check User Agent - used for orientation warning
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  console.log('📱 Mobile UA detection:', isMobileUA ? 'MOBILE' : 'DESKTOP');
  
  return isMobileUA;
};

export const IS_MOBILE = isMobileDevice();