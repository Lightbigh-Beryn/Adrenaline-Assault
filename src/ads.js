// Ad system with anti-cheat and verification
import { player } from './player.js';
import { GAME_CONFIG } from './config.js';

/* =========================
   ANTI-CHEAT SYSTEM
========================= */
export const ANTI_CHEAT = {
  verifyStorage: function() {
    try {
      const testKey = '_game_integrity_check';
      const testValue = Date.now().toString();
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      return retrieved === testValue;
    } catch (e) {
      return false;
    }
  },

  lastTimestamp: Date.now(),
  checkTimeTravel: function() {
    const now = Date.now();
    const elapsed = now - this.lastTimestamp;
    
    if (elapsed < -1000 || elapsed > 300000) {
      return true;
    }
    
    this.lastTimestamp = now;
    return false;
  },

  consoleDetected: false,
  detectConsole: function() {
    const threshold = 160;
    if (window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold) {
      this.consoleDetected = true;
      return true;
    }
    return false;
  },

  generateAdToken: function(adType, timestamp) {
    const data = `${adType}_${timestamp}_${player.score}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  },

  verifyAdToken: function(token, adType, timestamp) {
    const expected = this.generateAdToken(adType, timestamp);
    return token === expected;
  },

  logAdCompletion: function(adType) {
    const timestamp = Date.now();
    const token = this.generateAdToken(adType, timestamp);
    
    const adLog = JSON.parse(localStorage.getItem('ad_completion_log') || '[]');
    adLog.push({ adType, timestamp, token, score: player.score });
    
    if (adLog.length > 50) adLog.shift();
    
    localStorage.setItem('ad_completion_log', JSON.stringify(adLog));
    return token;
  },

  checkAdSpam: function() {
    const adLog = JSON.parse(localStorage.getItem('ad_completion_log') || '[]');
    if (adLog.length < 2) return false;
    
    const lastTwo = adLog.slice(-2);
    const timeDiff = lastTwo[1].timestamp - lastTwo[0].timestamp;
    
    return timeDiff < 5000;
  }
};

/* =========================
   AD CONFIG - ENHANCED (SINGLE VERSION)
========================= */
export const AD_CONFIG = {
  // Toggle this when you deploy with real ads
  REAL_ADS_ENABLED: false, // Set to true in production
  
  // Your ad network SDK URL (e.g., AdMob, Unity Ads)
  AD_SDK_URL: '',
  
  // Your backend API endpoint
  SERVER_ENABLED: false, // Set to true when you have a server
  API_ENDPOINT: 'https://yourgame.com/api', // Your server URL
  
  // Legacy support
  ACCOUNT_SYSTEM_ENABLED: false,
  
  // Ad unit IDs from your ad network
  AD_UNITS: {
    BOSS_REWARD: 'your-boss-ad-unit-id',
    REVIVE: 'your-revive-ad-unit-id',
    WHEEL: 'your-wheel-ad-unit-id'
  },
  
  // Get user identifier (should be tied to account system)
  getPlayerId: function() {
    // In production, this should be from your auth system
    if (this.SERVER_ENABLED || this.ACCOUNT_SYSTEM_ENABLED) {
      return localStorage.getItem('user_token') || this.generateGuestId();
    } else {
      return this.generateGuestId();
    }
  },
  
  // Generate unique guest ID if no account
  generateGuestId: function() {
    let guestId = localStorage.getItem('guest_id');
    if (!guestId) {
      guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guest_id', guestId);
    }
    return guestId;
  },
  
  /* =========================
     SERVER VERIFICATION
  ========================= */
  verifyAdWithServer: async function(adData) {
    if (!this.SERVER_ENABLED) {
      console.log('⚠️ Server verification disabled - using client-side only');
      return { success: true, message: 'Client-side verification only' };
    }
    
    try {
      const response = await fetch(`${this.API_ENDPOINT}/verify-ad`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getPlayerId()}`
        },
        body: JSON.stringify({
          user_id: this.getPlayerId(),
          ad_type: adData.type,
          ad_unit_id: adData.unitId,
          timestamp: Date.now(),
          game_state: {
            score: player.score,
            round: adData.round || 0,
            difficulty: adData.difficulty || 1
          },
          // Ad network callback data (provided by ad SDK)
          ad_network_data: adData.networkData
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.verified) {
        console.error('❌ Ad verification failed:', result.reason);
        return { success: false, reason: result.reason };
      }
      
      console.log('✅ Ad verified by server');
      return { success: true, reward: result.reward };
      
    } catch (error) {
      console.error('❌ Server verification error:', error);
      return { success: false, reason: 'Server communication failed' };
    }
  },
  
  // Legacy compatibility wrapper
  verifyAdCompletion: async function(adType, currentRound, difficultyLevel) {
    return this.verifyAdWithServer({
      type: adType,
      unitId: this.AD_UNITS.BOSS_REWARD,
      round: currentRound,
      difficulty: difficultyLevel,
      networkData: { legacy: true }
    });
  },
  
  // Legacy server request wrapper
  serverRequest: async function(endpoint, data) {
    if (!this.SERVER_ENABLED && !this.ACCOUNT_SYSTEM_ENABLED) {
      console.log('SIMULATED SERVER REQUEST:', endpoint, data);
      return { success: true, message: 'Simulated (no server yet)' };
    }
    
    try {
      const response = await fetch(this.API_ENDPOINT + endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('user_token')
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Server error');
      return await response.json();
    } catch (e) {
      console.error('Server request failed:', e);
      return { success: false, error: e.message };
    }
  },
  
  checkAdAbuse: function() {
    if (ANTI_CHEAT.checkAdSpam()) {
      return { abuse: true, reason: 'Ads completed too quickly' };
    }
    
    if (ANTI_CHEAT.checkTimeTravel()) {
      return { abuse: true, reason: 'System time manipulation detected' };
    }
    
    if (ANTI_CHEAT.consoleDetected) {
      return { abuse: true, reason: 'Developer console detected' };
    }
    
    return { abuse: false };
  },
  
  /* =========================
     SHOW AD WITH VERIFICATION (Enhanced signature with adData)
  ========================= */
  showBossAd: function(onComplete, onFailed, adState, adData = {}) {
    // Anti-cheat checks
    const abuseCheck = this.checkAdAbuse();
    if (abuseCheck.abuse) {
      onFailed(abuseCheck.reason);
      return;
    }
    
    // DEVELOPMENT MODE: Simulated ad
    if (!this.REAL_ADS_ENABLED) {
      console.log('🎬 Simulating boss reward ad...');
      adState.playing = true;
      adState.remaining = 3;
      
      const countdownInterval = setInterval(() => {
        adState.remaining--;
        if (adState.remaining <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
      
      setTimeout(async () => {
        adState.playing = false;
        
        // Even in dev mode, verify with server if enabled
        const verification = await this.verifyAdWithServer({
          type: 'boss_reward',
          unitId: this.AD_UNITS.BOSS_REWARD,
          round: adData.round || 0,
          difficulty: adData.difficulty || 1,
          networkData: { simulated: true }
        });
        
        if (verification.success) {
          console.log('✅ Ad verified');
          onComplete();
        } else {
          onFailed(verification.reason || 'Verification failed');
        }
      }, 3000);
      return;
    }
    
    // PRODUCTION MODE: Real ad network integration
    this.showRealAd('boss_reward', onComplete, onFailed, adState, adData);
  },
  
  showReviveAd: function(onComplete, onFailed, adState, adData = {}) {
    const abuseCheck = this.checkAdAbuse();
    if (abuseCheck.abuse) {
      onFailed(abuseCheck.reason);
      return;
    }
    
    if (!this.REAL_ADS_ENABLED) {
      console.log('🎬 Simulating revive ad...');
      adState.playing = true;
      adState.remaining = 3;
      
      const countdownInterval = setInterval(() => {
        adState.remaining--;
        if (adState.remaining <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
      
      setTimeout(async () => {
        adState.playing = false;
        
        const verification = await this.verifyAdWithServer({
          type: 'revive',
          unitId: this.AD_UNITS.REVIVE,
          round: adData.round || 0,
          difficulty: adData.difficulty || 1,
          networkData: { simulated: true }
        });
        
        if (verification.success) {
          console.log('✅ Ad verified');
          onComplete();
        } else {
          onFailed(verification.reason || 'Verification failed');
        }
      }, 3000);
      return;
    }
    
    this.showRealAd('revive', onComplete, onFailed, adState, adData);
  },
  
  /* =========================
     REAL AD NETWORK INTEGRATION
  ========================= */
  showRealAd: function(adType, onComplete, onFailed, adState, adData) {
    // This is where you integrate with your actual ad network
    
    if (!window.adNetwork) {
      onFailed('Ad network not loaded');
      return;
    }
    
    const adUnitId = this.AD_UNITS[adType.toUpperCase()];
    
    window.adNetwork.showRewardedAd({
      adUnitId: adUnitId,
      
      // Called when ad network confirms user watched the ad
      onRewarded: async (networkData) => {
        console.log('📺 Ad network confirmed ad view');
        
        // Verify with your server before giving reward
        const verification = await this.verifyAdWithServer({
          type: adType,
          unitId: adUnitId,
          round: adData.round || 0,
          difficulty: adData.difficulty || 1,
          networkData: networkData // Contains ad network's confirmation data
        });
        
        if (verification.success) {
          console.log('✅ Server verified - giving reward');
          onComplete(verification.reward);
        } else {
          console.error('❌ Server rejected ad:', verification.reason);
          onFailed('Ad verification failed');
        }
      },
      
      // Called if ad fails to load or user closes early
      onError: (error) => {
        console.error('❌ Ad error:', error);
        onFailed('Ad failed to load');
      },
      
      // Called when user closes ad
      onClosed: (completed) => {
        if (!completed) {
          onFailed('Ad closed before completion');
        }
      }
    });
  },
  
  /* =========================
     AD BLOCKER DETECTION
  ========================= */
  detectAdBlocker: function() {
    if (!this.REAL_ADS_ENABLED) return false;
    
    try {
      // Method 1: Check if ad SDK loaded
      if (this.AD_SDK_URL && !document.querySelector(`script[src="${this.AD_SDK_URL}"]`)) {
        return true;
      }
      
      // Method 2: Bait element test
      const testAd = document.createElement('div');
      testAd.className = 'adsbox ad-banner adsbygoogle';
      testAd.style.position = 'absolute';
      testAd.style.width = '1px';
      testAd.style.height = '1px';
      testAd.style.top = '-1px';
      document.body.appendChild(testAd);
      
      const isBlocked = testAd.offsetHeight === 0;
      document.body.removeChild(testAd);
      
      return isBlocked;
    } catch (e) {
      console.error('Ad blocker detection error:', e);
      return false;
    }
  }
};

// Initialize player ID
AD_CONFIG.getPlayerId();

/* =========================
   Boss Ad Tracking
========================= */
export function getBossAdHistory() {
  const stored = localStorage.getItem('bossAdsWatched');
  return stored ? JSON.parse(stored) : {};
}

export function setBossAdWatched(roundNum, bossIndex) {
  const history = getBossAdHistory();
  const key = `r${roundNum}_b${bossIndex}`;
  history[key] = Date.now();
  localStorage.setItem('bossAdsWatched', JSON.stringify(history));
}

export function canWatchBossAd(roundNum, bossIndex) {
  const history = getBossAdHistory();
  const key = `r${roundNum}_b${bossIndex}`;
  const lastWatch = history[key];
  
  if (!lastWatch) return true;
  return (Date.now() - lastWatch) >= GAME_CONFIG.AD_BOSS_COOLDOWN_MS;
}

export function msUntilBossAdAvailable(roundNum, bossIndex) {
  const history = getBossAdHistory();
  const key = `r${roundNum}_b${bossIndex}`;
  const lastWatch = history[key];
  
  if (!lastWatch) return 0;
  return Math.max(0, GAME_CONFIG.AD_BOSS_COOLDOWN_MS - (Date.now() - lastWatch));
}

/* =========================
   Revive Ad Tracking
========================= */
export function canWatchReviveAd() {
  const last = localStorage.getItem('lastReviveAdTime');
  if (!last) return true;
  return (Date.now() - parseInt(last, 10)) >= GAME_CONFIG.AD_COOLDOWN_MS;
}

export function setReviveAdCooldown() {
  localStorage.setItem('lastReviveAdTime', Date.now().toString());
}

export function msUntilReviveAdAvailable() {
  const last = localStorage.getItem('lastReviveAdTime');
  if (!last) return 0;
  return Math.max(0, GAME_CONFIG.AD_COOLDOWN_MS - (Date.now() - parseInt(last, 10)));
}

/* =========================
   Wheel Ad Tracking
========================= */
export function canWatchWheelAd() {
  const last = localStorage.getItem('lastWheelAdTime');
  if (!last) return true;
  return (Date.now() - parseInt(last, 10)) >= GAME_CONFIG.AD_COOLDOWN_MS;
}

export function setWheelAdCooldown() {
  localStorage.setItem('lastWheelAdTime', Date.now().toString());
}

export function msUntilWheelAdAvailable() {
  const last = localStorage.getItem('lastWheelAdTime');
  if (!last) return 0;
  return Math.max(0, GAME_CONFIG.AD_COOLDOWN_MS - (Date.now() - parseInt(last, 10)));
}