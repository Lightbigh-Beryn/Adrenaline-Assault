// Anti-cheat heuristics: DevTools detection, clock-tampering detection, ad-spam detection, ad tokens
import { player } from './player.js';

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
