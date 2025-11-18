// Powerup wheel system
import { player } from './player.js';
import { powerupPool } from './upgrades.js';
import { flashMessage } from './ui.js';
import { AD_CONFIG, setWheelAdCooldown } from './ads.js';

/* =========================
   Wheel State
========================= */
export let wheelState = {
  show: false,
  spinning: false,
  spinAngle: 0,
  spinSpeed: 0,
  result: null,
  ready: false
};

/* =========================
   Wheel Control
========================= */
export function showWheel() {
  wheelState.show = true;
  wheelState.spinning = false;
  wheelState.result = null;
  wheelState.ready = true;
  wheelState.spinAngle = 0;
  wheelState.spinSpeed = 0;
}

export function hideWheel() {
  wheelState.show = false;
  wheelState.spinning = false;
  wheelState.result = null;
  wheelState.ready = false;
}

export function startSpin() {
  if (!wheelState.ready || wheelState.spinning || wheelState.result) return;
  
  wheelState.spinning = true;
  wheelState.spinSpeed = 0.5 + Math.random() * 0.5;
  wheelState.ready = false;
}

/* =========================
   Wheel Update Logic
========================= */
export function updateWheel() {
  if (!wheelState.spinning) return;
  
  wheelState.spinAngle += wheelState.spinSpeed;
  wheelState.spinSpeed *= 0.98; // Friction
  
  // Check if spin finished
  if (wheelState.spinSpeed < 0.02 && wheelState.result === null) {
    wheelState.spinning = false;
    
    // Calculate result
    const sliceAngle = (Math.PI * 2) / powerupPool.length;
    let normalizedAngle = wheelState.spinAngle % (Math.PI * 2);
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
    
    let pointerAngle = (normalizedAngle + Math.PI / 2) % (Math.PI * 2);
    const sector = Math.floor(pointerAngle / sliceAngle) % powerupPool.length;
    
    wheelState.result = { ...powerupPool[sector] };
    wheelState.result.count = Math.floor(Math.random() * 2) + 1; // 1-2 uses
    wheelState.result.doubled = false; // Track if reward was doubled
    
    console.log('Wheel Result:', wheelState.result.name, 'x', wheelState.result.count);
  }
}

/* =========================
   Wheel Ad Reward
========================= */
export function watchWheelAd(adState, onComplete, onFailed) {
  if (wheelState.result.doubled) {
    flashMessage('Already doubled!', 1000);
    return;
  }
  
  AD_CONFIG.showBossAd(
    // On Success
    () => {
      setWheelAdCooldown();
      const originalCount = wheelState.result.count;
      wheelState.result.count *= 2;
      wheelState.result.doubled = true;
      
      if (!player.powerups) player.powerups = {};
      player.powerups[wheelState.result.key] = (player.powerups[wheelState.result.key] || 0) + originalCount;
      
      flashMessage(`Doubled! Got ${wheelState.result.count} ${wheelState.result.name}!`, 2000);
      if (onComplete) onComplete();
    },
    // On Failure
    (reason) => {
      flashMessage('Ad failed: ' + reason, 2000);
      if (onFailed) onFailed(reason);
    },
    adState
  );
}

/* =========================
   Wheel Claim Reward
========================= */
export function claimWheelReward() {
  if (!wheelState.result) return;
  
  if (!player.powerups) player.powerups = {};
  
  const count = wheelState.result.count;
  const name = wheelState.result.name;
  const key = wheelState.result.key;
  
  player.powerups[key] = (player.powerups[key] || 0) + count;
  
  flashMessage(`Got ${count} ${name}!`, 1500);
  hideWheel();
  // The unpause is handled in main.js by returning 'unpause' from checkWheelClick
}

/* =========================
   Wheel Click Detection
========================= */
export function checkWheelClick(mx, my, canvas, adState) {
  if (!wheelState.result) return false; // Only allow clicks after spin completes
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 140;
  
  // Watch Ad button
  const adBtnY = cy + radius + 65;
  const adBtnW = 320;
  const adBtnH = 45;
  const adBtnX = cx - adBtnW / 2;
  
  if (mx >= adBtnX && mx <= adBtnX + adBtnW && my >= adBtnY && my <= adBtnY + adBtnH) {
    watchWheelAd(adState);
    return true;
  }
  
  // Start Round button
  const startBtnY = adBtnY + adBtnH + 15;
  const startBtnW = 300;
  const startBtnH = 60;
  const startBtnX = cx - startBtnW / 2;
  
  if (mx >= startBtnX && mx <= startBtnX + startBtnW && my >= startBtnY && my <= startBtnY + startBtnH) {
    claimWheelReward();
    return 'unpause';
  }
  
  return false;
}

/* =========================
   Export State for Drawing
========================= */
export function getWheelState() {
  return wheelState;
}