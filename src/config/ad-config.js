// =========================================================
// AD NETWORK SETTINGS — Ridge, this is your file.
// =========================================================
// Everything below is plain configuration. Fill these in once
// you've picked an ad network and have server hosting ready.
// Nothing else in the codebase needs to change.

export const AD_SETTINGS = {
  // Flip this to true once real ads are wired up and tested.
  // While false, ads are simulated (3-second fake countdown, auto-reward).
  REAL_ADS_ENABLED: false,

  // Your ad network's SDK script URL (e.g. AdMob, Unity Ads, IronSource).
  // Leave blank until you have one.
  AD_SDK_URL: '',

  // Set true once you have a backend server that can verify ad completions.
  // While false, ad completions are trusted client-side only (fine for dev/testing,
  // NOT recommended once real money/rewards are on the line).
  SERVER_ENABLED: false,

  // Your backend's base API URL, e.g. 'https://ppg.example.com/api'
  API_ENDPOINT: 'https://yourgame.com/api',

  // Legacy flag — leave false unless you're building a full account/login system.
  ACCOUNT_SYSTEM_ENABLED: false,

  // Ad unit / placement IDs from your ad network dashboard.
  // BOSS_REWARD = watched after defeating a boss for bonus credits/power
  // REVIVE      = watched on the game-over screen to continue
  // WHEEL       = watched to unlock/respin the powerup wheel
  AD_UNITS: {
    BOSS_REWARD: 'your-boss-ad-unit-id',
    REVIVE: 'your-revive-ad-unit-id',
    WHEEL: 'your-wheel-ad-unit-id'
  }
};
