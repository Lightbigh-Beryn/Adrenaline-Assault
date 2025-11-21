
// All game constants and configuration settings
export const GAME_CONFIG = {
  LEVEL_WIDTH: 18000,
  BASE_SCROLL_SPEED: 1.5,
  ENEMY_SPAWN_MS: 900,
  AD_REVIVE_SECONDS: 3,
  AD_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 hours
  IFRAME_DURATION_MS: 3000, // 3 seconds of invulnerability after hit
  IFRAME_ENABLED: true,
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
  // Only check User Agent - most reliable method
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Log for debugging
  console.log('📱 Device detection:', isMobileUA ? 'MOBILE' : 'DESKTOP');
  console.log('   User Agent:', navigator.userAgent);
  console.log('   Window size:', window.innerWidth, '×', window.innerHeight);
  
  return isMobileUA;
};

export const IS_MOBILE = isMobileDevice();