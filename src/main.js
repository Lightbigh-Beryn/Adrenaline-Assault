// src/main.js - Main game loop and state management
import { GAME_CONFIG, CANVAS_CONFIG, createBossTriggers } from './config.js';
import { bgImage, bgLoaded, areAllAssetsLoaded, getLoadingProgress, waitForAssets } from './assets.js';
import { initCanvas, drawStarfield, drawTitleScreen, drawCountdown, drawPauseScreen, 
         drawHealthBar, drawActiveUpgrades, drawPowerupInventory, drawGameOverOverlay, 
         drawAdOverlay, drawTouchControls, drawGameEntities, drawProjectiles, 
         flashMessage, drawFlashMessage, drawOrientationWarning, drawLoadingScreen } from './ui.js'; 
import { drawUpgradePopup, drawBattleSummary, drawPowerupWheel } from './ui-menus.js';
import { player, resetRoundStats, calculatePerformanceRating, roundStats } from './player.js';
import { enemies, enemyBullets, spawnEnemy, enemyShoot, resetEnemies, ENEMY_TYPES } from './enemies.js';
import { bosses, homingMissiles, spawnBoss, bossConeShotAttack, bossHomingMissileAttack, 
         bossSpiralAttack, resetBosses } from './bosses.js';
import { openUpgradePopup, purchaseUpgradeAt, TIMED_POWERUPS, isAnyPowerupActive, 
         applyRandomSpecialPower, currentUpgradeChoices } from './upgrades.js';
import { attemptShoot, aabbCollide, createHitSpark, updateHitSparks } from './weapons.js';
import { setupInputHandlers, keys, mouse, touchControls, userHasInteracted, 
         isKeyPressed, getTouchMovement } from './input.js';
import { showWheel, hideWheel, startSpin, updateWheel, checkWheelClick, 
         getWheelState } from './powerups.js';
import { ANTI_CHEAT, AD_CONFIG, canWatchBossAd, setBossAdWatched, msUntilBossAdAvailable,
         canWatchReviveAd, setReviveAdCooldown, msUntilReviveAdAvailable } from './ads.js';
import { updateCameraShake, cameraShake, triggerCameraShake, updateFPS, getFPS } from './utils.js';

/* =========================
   Canvas Setup
========================= */
const canvas = initCanvas();
const ctx = canvas.getContext('2d');

/* =========================
   Game State
========================= */
let gameState = 'loading'; // 'title', 'countdown', 'playing'
let countdownValue = 3;
let countdownStartTime = 0;
let cameraX = 0;
let roundCameraX = 0;
let scrollSpeed = GAME_CONFIG.BASE_SCROLL_SPEED;
let bossActive = false;
let isGameOver = false;
let isPaused = false;
let upgradeOpen = false;
let difficultyLevel = 1;
let bossesDefeated = 0;
let currentRound = 1;
let lastTime = performance.now();
let lastEnemySpawnTime = 0;
let enemySpawnInterval = GAME_CONFIG.ENEMY_SPAWN_MS; 

// Boss tracking
let bossTriggers = createBossTriggers();
let lastBossType = null;
let lastBossIndex = -1;

// Battle summary
let showBattleSummary = false;
let summaryData = null;

// Ad state
let adState = {
  playing: false,
  remaining: 0,
  blockerDetected: false,
  failureMessage: '',
  watchInProgress: false
};

// Upgrade state
let afterReviveShowUpgrade = false;

/* =========================
   Input Setup
========================= */
setupInputHandlers(canvas, {
  onKeyDown: handleKeyDown,
  onMouseDown: handleMouseDown,
  onWindowBlur: handleWindowBlur
});

/* =========================
   Key Down Handler
========================= */
function handleKeyDown(e) {
  // Wheel controls
  const wheelState = getWheelState();
  if (wheelState.show && wheelState.ready && !wheelState.spinning && !wheelState.result && 
      (e.code === 'Space' || e.code === 'Enter')) {
    startSpin();
    e.preventDefault();
    return;
  }
  
  // Pause toggle
  if ((e.code === 'Escape' || e.code === 'KeyP') && gameState === 'playing' && 
      !isGameOver && !upgradeOpen && !wheelState.show) {
    isPaused = !isPaused;
    return;
  }
  
  // Powerup activation (1-4 keys)
  if (gameState === 'playing' && !isPaused && !isGameOver && !upgradeOpen && !wheelState.show) {
    Object.entries(TIMED_POWERUPS).forEach(([id, powerup]) => {
      if (e.key === powerup.key && player.powerups[id] > 0) {
        const activePowerup = isAnyPowerupActive();
        if (activePowerup) {
          flashMessage(`Wait for ${activePowerup} to finish!`, 1500);
          return;
        }
        
        player.powerups[id]--;
        powerup.apply();
        flashMessage(`${powerup.name.replace('\n', ' ')} activated!`, 1500);
      }
    });
  }
  
  // Debug keys (remove in production)
  if (e.key === 'b') spawnBoss('mini', cameraX + canvas.width - 200, -1);
  if (e.key === 'n') spawnBoss('final', cameraX + canvas.width - 200, -1);
  if (e.key === 'k') { 
    resetEnemies();
    resetBosses();
  }
  if (e.key === 'h') {
    if (!player.powerups) player.powerups = {};
    player.powerups.homingMissiles = (player.powerups.homingMissiles || 0) + 5;
    player.powerups.shieldBubble = (player.powerups.shieldBubble || 0) + 5;
    player.powerups.slowTime = (player.powerups.slowTime || 0) + 5;
    player.powerups.ultraDamage = (player.powerups.ultraDamage || 0) + 5;
    flashMessage('Added 5 charges to ALL power-ups!', 2500);
  }
}

/* =========================
   Mouse/Touch Click Handler
========================= */
function handleMouseDown(e, mousePos) {
  const mx = mousePos.x;
  const my = mousePos.y;
  
  // Wheel clicks
  const wheelState = getWheelState();
  if (wheelState.show) {
    if (checkWheelClick(mx, my, canvas, adState)) {
      return;
    }
  }
  
  // Title screen
  if (gameState === 'title') {
    checkTitleScreenClick(mx, my);
    return;
  }
  
  // Battle summary
  if (showBattleSummary) {
    checkBattleSummaryClick(mx, my);
    return;
  }
  
  // Pause screen
  if (isPaused && !wheelState.show) {
    checkPauseScreenClick(mx, my);
    return;
  }
  
  // Hotbar clicks (during gameplay)
  if (gameState === 'playing' && !isPaused && !isGameOver && !upgradeOpen && !wheelState.show) {
    if (checkHotbarClick(mx, my)) {
      return;
    }
  }
  
  // Upgrade popup
  if (upgradeOpen) {
    checkUpgradePopupClick(mx, my);
    return;
  }
  
  // Game over screen
  if (isGameOver) {
    checkGameOverClick(mx, my);
    return;
  }
}

/* =========================
   Window Blur Handler
========================= */
function handleWindowBlur() {
  if (gameState === 'playing' && !isGameOver && !upgradeOpen && !isPaused) {
    isPaused = true;
    flashMessage('Game paused (tab inactive)', 2000);
  }
}

/* =========================
   Title Screen Click
========================= */
function checkTitleScreenClick(mx, my) {
  const btnW = 240, btnH = 60;
  const btnX = canvas.width / 2 - btnW / 2;
  const btnY = canvas.height / 2 + 120;
  
  if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
    startCountdown();
  }
}

/* =========================
   Pause Screen Click
========================= */
function checkPauseScreenClick(mx, my) {
  const btnW = 260, btnH = 70;
  const resumeX = canvas.width / 2 - btnW / 2;
  const resumeY = canvas.height / 2 - 20;
  const quitY = resumeY + btnH + 30;
  
  // Resume button
  if (mx >= resumeX && mx <= resumeX + btnW && my >= resumeY && my <= resumeY + btnH) {
    isPaused = false;
    return;
  }
  
  // Quit button
  if (mx >= resumeX && mx <= resumeX + btnW && my >= quitY && my <= quitY + btnH) {
    returnToTitle();
  }
}

/* =========================
   Hotbar Click
========================= */
function checkHotbarClick(mx, my) {
  const powerupArray = Object.entries(TIMED_POWERUPS);
  const SLOT_SIZE = 48;
  const SPACING = 12;
  const totalWidth = (powerupArray.length * SLOT_SIZE) + ((powerupArray.length - 1) * SPACING);
  const startX = (canvas.width - totalWidth) / 2;
  const startY = canvas.height - SLOT_SIZE - 15;
  
  for (let i = 0; i < powerupArray.length; i++) {
    const [id, powerup] = powerupArray[i];
    const slotX = startX + (i * (SLOT_SIZE + SPACING));
    const slotY = startY;
    
    if (mx >= slotX && mx <= slotX + SLOT_SIZE && my >= slotY && my <= slotY + SLOT_SIZE) {
      const count = player.powerups[id] || 0;
      if (count > 0) {
        const activePowerup = isAnyPowerupActive();
        if (activePowerup) {
          flashMessage(`Wait for ${activePowerup} to finish!`, 1500);
          return true;
        }
        
        player.powerups[id]--;
        powerup.apply();
        flashMessage(`${powerup.name.replace('\n', ' ')} activated!`, 1500);
        return true;
      } else {
        flashMessage('No charges remaining!', 1000);
        return true;
      }
    }
  }
  
  return false;
}

/* =========================
   Upgrade Popup Click
========================= */
function checkUpgradePopupClick(mx, my) {
  const w = Math.min(720, canvas.width - 120);
  const boxX = (canvas.width - w) / 2;
  const startY = canvas.height / 2 - 150;
  const btnH = 64;
  
  // Clear ad messages on click
  if (adState.failureMessage || adState.blockerDetected) {
    adState.failureMessage = '';
    adState.blockerDetected = false;
    return;
  }
  
  // Check upgrade choices
  for (let i = 0; i < currentUpgradeChoices.length; i++) {
    const bx = boxX;
    const by = startY + i * (btnH + 14);
    if (mx >= bx && mx <= bx + w && my >= by && my <= by + btnH) {
      const result = purchaseUpgradeAt(i);
      if (result.message) {
        flashMessage(result.message, 1500);
      }
      return;
    }
  }
  
  // Check ad buttons (boss rewards)
  if (!afterReviveShowUpgrade && lastBossType && lastBossIndex >= 0) {
    const adY = startY + currentUpgradeChoices.length * (btnH + 14) + 20;
    
    if (lastBossType === 'mini') {
      const adW = 320, adH = 50;
      const adX = canvas.width / 2 - adW / 2;
      if (mx >= adX && mx <= adX + adW && my >= adY && my <= adY + adH) {
        if (canWatchBossAd(currentRound, lastBossIndex) && !adState.watchInProgress) {
          watchAdForCredits();
        } else {
          flashMessage('Boss ad still on cooldown', 1500);
        }
        return;
      }
    }
    
    if (lastBossType === 'final') {
      const adW = 360, adH = 50;
      const adX = canvas.width / 2 - adW / 2;
      if (mx >= adX && mx <= adX + adW && my >= adY && my <= adY + adH) {
        if (canWatchBossAd(currentRound, lastBossIndex) && !adState.watchInProgress) {
          watchAdForSpecialPower();
        } else {
          flashMessage('Boss ad still on cooldown', 1500);
        }
        return;
      }
    }
  }
  
  // Continue button
  const skipW = 200, skipH = 50;
  const skipX = canvas.width / 2 - skipW / 2;
  const skipY = startY + currentUpgradeChoices.length * (btnH + 14) + 
                (lastBossType && !afterReviveShowUpgrade ? 85 : 25);
  if (mx >= skipX && mx <= skipX + skipW && my >= skipY && my <= skipY + skipH) {
    closeUpgradePopup();
  }
}

/* =========================
   Battle Summary Click
========================= */
function checkBattleSummaryClick(mx, my) {
  const centerX = canvas.width / 2;
  const boxY = 220;
  const boxH = 280;
  const contBtnY = boxY + boxH + 30;
  const contBtnW = 280;
  const contBtnH = 60;
  const contBtnX = centerX - contBtnW / 2;
  
  if (mx >= contBtnX && mx <= contBtnX + contBtnW && my >= contBtnY && my <= contBtnY + contBtnH) {
    showBattleSummary = false;
    summaryData = null;
    
    if (lastBossType === 'final' && lastBossIndex >= 0) {
      isPaused = false;
      openUpgradePopupWithBoss();
    } else {
      isPaused = false;
      continueToNextRound();
    }
  }
}

/* =========================
   Game Over Click
========================= */
function checkGameOverClick(mx, my) {
  const centerX = canvas.width / 2;
  const baseY = canvas.height / 2 - 40;
  const rbW = 220, rbH = 62;
  const rbX = centerX - rbW / 2;
  const rbY = baseY;
  const abW = 340, abH = 62;
  const abX = centerX - abW / 2;
  const abY = baseY + 100;
  
  // Restart button
  if (mx >= rbX && mx <= rbX + rbW && my >= rbY && my <= rbY + rbH) {
    restartFull();
    return;
  }
  
  // Ad continue button
  if (mx >= abX && mx <= abX + abW && my >= abY && my <= abY + abH) {
    if (canWatchReviveAd()) {
      handleAdRevive();
    } else {
      flashMessage('Ad revive not available yet', 1200);
    }
  }
}

/* =========================
   Ad Functions
========================= */
function watchAdForCredits() {
  if (adState.watchInProgress) {
    flashMessage('Ad already in progress!', 1000);
    return;
  }
  
  adState.blockerDetected = AD_CONFIG.detectAdBlocker();
  if (adState.blockerDetected) {
    adState.failureMessage = 'Ad blocker detected! Please disable it to watch ads.';
    upgradeOpen = true;
    return;
  }
  
  upgradeOpen = false;
  adState.watchInProgress = true;
  
  AD_CONFIG.showBossAd(
    () => {
      adState.watchInProgress = false;
      setBossAdWatched(currentRound, lastBossIndex);
      player.score += 2000;
      flashMessage('+2000 Credits!', 2000);
      openUpgradePopupWithBoss();
    },
    (reason) => {
      adState.watchInProgress = false;
      adState.failureMessage = reason || 'Ad was closed early. No reward given.';
      openUpgradePopupWithBoss();
    },
    adState
  );
}

function watchAdForSpecialPower() {
  if (adState.watchInProgress) {
    flashMessage('Ad already in progress!', 1000);
    return;
  }
  
  adState.blockerDetected = AD_CONFIG.detectAdBlocker();
  if (adState.blockerDetected) {
    adState.failureMessage = 'Ad blocker detected! Please disable it to watch ads.';
    upgradeOpen = true;
    return;
  }
  
  upgradeOpen = false;
  adState.watchInProgress = true;
  
  AD_CONFIG.showBossAd(
    () => {
      adState.watchInProgress = false;
      setBossAdWatched(currentRound, lastBossIndex);
      const result = applyRandomSpecialPower(); // ✅ Changed
      flashMessage(result.message, 2000); // ✅ Use returned message
      closeUpgradePopup();
    },
    (reason) => {
      adState.watchInProgress = false;
      adState.failureMessage = reason || 'Ad was closed early. No reward given.';
      openUpgradePopupWithBoss();
    },
    adState
  );
}

function handleAdRevive() {
  adState.blockerDetected = AD_CONFIG.detectAdBlocker();
  if (adState.blockerDetected) {
    adState.failureMessage = 'Ad blocker detected! Please disable it to continue.';
    return;
  }
  
  AD_CONFIG.showReviveAd(
    () => {
      setReviveAdCooldown();
      player.health = Math.max(10, Math.floor(player.maxHealth / 2));
      isGameOver = false;
      resetEnemies();
      resetBosses();
      openUpgradePopupWithBoss(true);
    },
    (reason) => {
      adState.failureMessage = reason || 'Ad was closed early. No continue given.';
    },
    adState
  );
}

/* =========================
   Upgrade Popup Management
========================= */
function openUpgradePopupWithBoss(isRevive = false) {
  const result = openUpgradePopup(isRevive, lastBossType, lastBossIndex);
  upgradeOpen = true;
  afterReviveShowUpgrade = result.afterRevive;
  scrollSpeed = 0;
}

function closeUpgradePopup() {
  upgradeOpen = false;
  afterReviveShowUpgrade = false;
  
  const wasFinalBoss = (lastBossType === 'final' && lastBossIndex >= 0);
  
  lastBossType = null;
  lastBossIndex = -1;
  bossActive = false;
  
  if (wasFinalBoss) {
    continueToNextRound();
  } else {
    scrollSpeed = GAME_CONFIG.BASE_SCROLL_SPEED;
  }
}

/* =========================
   Round Management
========================= */
function startNewRound() {
  if (showBattleSummary || summaryData !== null) {
    return;
  }
  
  if (currentRound >= 1 && roundCameraX >= GAME_CONFIG.ROUND_LENGTH) {
    showRoundSummary();
    return;
  }
  
  continueToNextRound();
}

function continueToNextRound() {
  currentRound++;
  roundCameraX = 0;
  
  bossTriggers = createBossTriggers();
  
  resetEnemies();
  resetRoundStats();
  
  showWheel();
  isPaused = true;
  
  flashMessage(`ROUND ${currentRound} - Difficulty Level ${difficultyLevel}!`, 3000);
}

function showRoundSummary() {
  roundStats.endTime = Date.now();
  roundStats.duration = Math.floor((roundStats.endTime - roundStats.startTime) / 1000);
  roundStats.finalScore = player.score;
  
  const accuracy = player.stats.shotsFired > 0 
    ? Math.floor((player.stats.shotsHit / player.stats.shotsFired) * 100) 
    : 0;
  
  summaryData = {
    round: currentRound,
    duration: roundStats.duration,
    score: roundStats.finalScore,
    accuracy: accuracy,
    difficulty: difficultyLevel,
    stats: { ...player.stats },
    rating: calculatePerformanceRating(roundStats.duration, player.stats.damageTaken)
  };
  
  showBattleSummary = true;
  isPaused = true;
}

/* =========================
   Game Flow
========================= */
function startCountdown() {
  gameState = 'countdown';
  countdownValue = 3;
  countdownStartTime = performance.now();
}

function startActualGameplay() {
  gameState = 'playing';
  lastTime = performance.now();
  roundStats.startTime = Date.now();
  
  showWheel();
  isPaused = true;
}

function returnToTitle() {
  gameState = 'title';
  isPaused = false;
  isGameOver = false;
  upgradeOpen = false;
  bossActive = false;
  showBattleSummary = false;
  summaryData = null;
  hideWheel();
  
  player.x = 120;
  player.y = 200;
  player.health = player.maxHealth;
  player.bullets.length = 0;
  player.score = 0;
  
  resetEnemies();
  resetBosses();
  
  scrollSpeed = GAME_CONFIG.BASE_SCROLL_SPEED;
  cameraX = 0;
  roundCameraX = 0;
  difficultyLevel = 1;
  bossesDefeated = 0;
  currentRound = 1;
  bossTriggers = createBossTriggers();
  lastBossType = null;
  lastBossIndex = -1;
}

function restartFull() {
  player.x = 120;
  player.y = Math.max(60, canvas.height / 2 - player.height / 2);
  player.health = player.maxHealth;
  player.bullets.length = 0;
  
  resetEnemies();
  resetBosses();
  
  bossActive = false;
  upgradeOpen = false;
  isGameOver = false;
  adState.playing = false;
  adState.remaining = 0;
  player.score = 0;
  scrollSpeed = GAME_CONFIG.BASE_SCROLL_SPEED;
  cameraX = 0;
  roundCameraX = 0;
  isPaused = false;
  difficultyLevel = 1;
  bossesDefeated = 0;
  bossTriggers = createBossTriggers();
  currentRound = 1;
  lastBossType = null;
  lastBossIndex = -1;
  
  startCountdown();
}

/* =========================
   Boss Management
========================= */
function checkBossesByPosition() {
  for (const trig of bossTriggers) {
    if (!trig.spawned && roundCameraX >= trig.cameraX) {
      trig.spawned = true;
      spawnBoss(trig.type, cameraX + canvas.width - 200, trig.index, bossesDefeated, cameraX, canvas);
      resetEnemies();
      bossActive = true;
      break;
    }
  }
}

/* =========================
   Update Loop
========================= */
function update() {
  const now = performance.now();
  const deltaMs = Math.max(1, now - lastTime);
  const delta = deltaMs / 16.67;
  lastTime = now;
  
  updateCameraShake();
  updateFPS();
  
  // Update wheel
  const wheelState = getWheelState();
  if (wheelState.show && wheelState.spinning) {
    updateWheel();
  }
  
  if (gameState !== 'playing' || adState.playing || upgradeOpen || isGameOver || isPaused || wheelState.show) {
    return;
  }
  
  // Scroll camera
  if (!bossActive) {
    cameraX += scrollSpeed * delta;
    cameraX = Math.min(cameraX, GAME_CONFIG.LEVEL_WIDTH - canvas.width);
    player.x += scrollSpeed * delta;
    roundCameraX += scrollSpeed * delta;
    
    if (roundCameraX >= GAME_CONFIG.ROUND_LENGTH) {
      startNewRound();
    }
  }
  
  // Player movement
  if (isKeyPressed('ArrowLeft') || isKeyPressed('KeyA')) player.x -= player.speed * delta;
  if (isKeyPressed('ArrowRight') || isKeyPressed('KeyD')) player.x += player.speed * delta;
  if (isKeyPressed('ArrowUp') || isKeyPressed('KeyW')) player.y -= player.speed * delta;
  if (isKeyPressed('ArrowDown') || isKeyPressed('KeyS')) player.y += player.speed * delta;
  
  // Touch movement
  const touchMovement = getTouchMovement();
  if (touchMovement.x !== 0 || touchMovement.y !== 0) {
    player.x += touchMovement.x * player.speed * delta;
    player.y += touchMovement.y * player.speed * delta;
  }
  
  // Constrain player
  const minY = 50;
  const maxY = canvas.height - player.height - 50;
  player.x = Math.max(cameraX + 4, Math.min(cameraX + canvas.width - player.width - 4, player.x));
  player.y = Math.max(minY, Math.min(maxY, player.y));
  
  // Player shooting
  attemptShoot(isGameOver, adState.playing, upgradeOpen, isPaused);
  
  // Update player bullets
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const b = player.bullets[i];
    b.x += (b.vx || 15) * delta;
    b.y += (b.vy || 0) * delta;
    
    if (b.x > GAME_CONFIG.LEVEL_WIDTH + 200 || b.y < -100 || b.y > canvas.height + 100) {
      player.bullets.splice(i, 1);
    }
  }
  
  // Player bullets vs enemies
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const b = player.bullets[i];
    let bulletHit = false;
    
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      
      if (aabbCollide({ x: b.x, y: b.y, width: b.width, height: b.height }, e)) {
        const damageDealt = Math.min(b.damage, e.health);
        e.health -= b.damage;
        
        player.stats.shotsHit++;
        player.stats.damageDealt += damageDealt;
        
        createHitSpark(b.x, b.y, '#00ffff');
        
        if (b.pierce > 0) {
          b.pierce -= 1;
        } else {
          bulletHit = true;
        }
        
        if (e.health <= 0) {
          const scoreGained = Math.floor(e.scoreValue * player.scoreMultiplier);
          player.score += scoreGained;
          player.stats.enemiesKilled++;
          player.stats.creditsEarned += scoreGained;
          if (player.stats.enemyKills[e.type] !== undefined) {
            player.stats.enemyKills[e.type]++;
          }
          enemies.splice(j, 1);
        }
        
        if (bulletHit) break;
      }
    }
    
    if (bulletHit) {
      player.bullets.splice(i, 1);
    }
  }
  
  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.x -= e.speed * delta;
    
    if (e.behavior) e.behavior(e, player);
    
    e.y = Math.max(minY, Math.min(maxY - e.height, e.y));
    
    // Enemy shooting
    if (e.canShoot) {
      const now = Date.now();
      const shootCooldown = e.shootCooldown || 2000;
      
      if (!e.lastShot) e.lastShot = now - Math.random() * shootCooldown;
      
      if (now - e.lastShot >= shootCooldown) {
        e.lastShot = now;
        enemyShoot(e, gameState, isGameOver);
      }
    }
    
    if (e.x + e.width < cameraX - 200) {
      enemies.splice(i, 1);
      continue;
    }
    
    // Enemy collision with player
    if (!player.invincible && !player.iframeActive && aabbCollide(e, player)) {
      const contactDamage = e.isKamikaze ? e.explosionDamage : 20;
      player.health -= contactDamage;
      player.stats.damageTaken += contactDamage;
      enemies.splice(i, 1);
      
      if (e.isKamikaze) {
        flashMessage('KAMIKAZE HIT!', 800);
        triggerCameraShake(15, 400);
      }
      
      if (player.health <= 0) {
        player.health = 0;
        isGameOver = true;
        return;
      }
      
      if (GAME_CONFIG.IFRAME_ENABLED && !player.iframeActive) {
        player.iframeActive = true;
        player.iframeEnd = Date.now() + GAME_CONFIG.IFRAME_DURATION_MS;
      }
    }
  }
  
  // Update bosses
  for (let bi = bosses.length - 1; bi >= 0; bi--) {
    const B = bosses[bi];
    
    if (!B.enraged && B.health <= B.maxHealth * 0.3) {
      B.enraged = true;
flashMessage('BOSS ENRAGED!', 2000);
}
B.moveTimer += deltaMs;
if (B.moveTimer > 3000) {
  B.moveTimer = 0;
  B.movePattern = (B.movePattern + 1) % 3;
}

if (B.movePattern === 0) {
  B.y += Math.sin(Date.now() / 500) * 2 * delta;
} else if (B.movePattern === 1) {
  B.y += 1.5 * delta;
} else {
  B.y -= 1.5 * delta;
}

B.y = Math.max(30, Math.min(canvas.height - B.height - 30, B.y));

// Boss attacks
if (B.type === 'mini') {
  bossConeShotAttack(B, player);
  if (B.enraged) bossHomingMissileAttack(B, player);
} else if (B.type === 'final') {
  bossConeShotAttack(B, player);
  bossSpiralAttack(B, player);
  bossHomingMissileAttack(B, player);
}

// Boss vs player bullets
for (let i = player.bullets.length - 1; i >= 0; i--) {
  const b = player.bullets[i];
  if (aabbCollide({ x: b.x, y: b.y, width: b.width, height: b.height }, B)) {
    B.health -= b.damage;
    
    createHitSpark(b.x, b.y, '#ffff00');
    
    if (b.pierce > 0) b.pierce -= 1;
    else player.bullets.splice(i, 1);
    
    if (B.health <= 0) {
      const bossReward = Math.floor(1000 * player.scoreMultiplier);
      player.score += bossReward;
      player.stats.bossesDefeated++;
      player.stats.creditsEarned += bossReward;
      
      const defeatedBossType = B.type;
      const defeatedBossIndex = B.bossIndex;
      bosses.splice(bi, 1);
      resetEnemies();
      bossActive = false;
      bossesDefeated++;
      difficultyLevel = 1 + bossesDefeated;
      flashMessage(`Difficulty Level ${difficultyLevel}!`, 2000);
      
      if (defeatedBossType === 'final') {
        showRoundSummary();
        lastBossType = defeatedBossType;
        lastBossIndex = defeatedBossIndex;
      } else {
        lastBossType = defeatedBossType;
        lastBossIndex = defeatedBossIndex;
        openUpgradePopupWithBoss();
      }
    }
    break;
  }
}

// Boss collision with player
if (!player.invincible && !player.iframeActive && aabbCollide(B, player)) {
  const contactDamage = 15;
  player.health -= contactDamage;
  player.stats.damageTaken += contactDamage;
  
  if (player.health <= 0) {
    player.health = 0;
    isGameOver = true;
    return;
  }
  
  if (GAME_CONFIG.IFRAME_ENABLED && !player.iframeActive) {
    player.iframeActive = true;
    player.iframeEnd = Date.now() + GAME_CONFIG.IFRAME_DURATION_MS;
  }
}
}
// Update enemy bullets
for (let i = enemyBullets.length - 1; i >= 0; i--) {
const b = enemyBullets[i];
b.x += b.vx * delta;
b.y += b.vy * delta;

if (b.x < cameraX - 200 || b.y < -100 || b.y > canvas.height + 100) {
  enemyBullets.splice(i, 1);
  continue;
}

if (!player.invincible && !player.iframeActive && aabbCollide(b, player)) {
  const damageAmount = Math.min(b.damage, player.health);
  player.health -= b.damage;
  player.stats.damageTaken += damageAmount;
  
  createHitSpark(b.x, b.y, '#ff6600');
  
  enemyBullets.splice(i, 1);
  
  if (player.health <= 0) {
    player.health = 0;
    isGameOver = true;
    return;
  }
  
  if (GAME_CONFIG.IFRAME_ENABLED && !player.iframeActive) {
    player.iframeActive = true;
    player.iframeEnd = Date.now() + GAME_CONFIG.IFRAME_DURATION_MS;
  }
}
}
// Update homing missiles
for (let i = homingMissiles.length - 1; i >= 0; i--) {
const m = homingMissiles[i];
const elapsed = Date.now() - m.homingStart;
if (elapsed < m.homingDuration) {
  let target = m.isPlayerMissile ? null : player;
  
  if (m.isPlayerMissile) {
    let minDist = Infinity;
    enemies.forEach(e => {
      const dist = Math.sqrt((e.x - m.x) ** 2 + (e.y - m.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        target = e;
      }
    });
    
    bosses.forEach(b => {
      const dist = Math.sqrt((b.x - m.x) ** 2 + (b.y - m.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        target = b;
      }
    });
  }
  
  if (target) {
    const dx = target.x - m.x;
    const dy = target.y - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const targetVx = (dx / dist) * m.speed;
      const targetVy = (dy / dist) * m.speed;
      m.vx += (targetVx - m.vx) * m.turnRate;
      m.vy += (targetVy - m.vy) * m.turnRate;
      const currentSpeed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
      if (currentSpeed > 0) {
        m.vx = (m.vx / currentSpeed) * m.speed;
        m.vy = (m.vy / currentSpeed) * m.speed;
      }
    }
  }
}

m.x += m.vx * delta;
m.y += m.vy * delta;

if (!m.trail) m.trail = [];
m.trail.unshift({ x: m.x, y: m.y });
if (m.trail.length > 20) m.trail.pop();

if (m.x < cameraX - 200 || m.x > cameraX + canvas.width + 200 || 
    m.y < -100 || m.y > canvas.height + 100) {
  homingMissiles.splice(i, 1);
  continue;
}

// Player missile collisions
if (m.isPlayerMissile) {
  let missileHit = false;
  
  for (let j = enemies.length - 1; j >= 0; j--) {
    const e = enemies[j];
    if (aabbCollide(m, e)) {
      const damageDealt = Math.min(m.damage, e.health);
      e.health -= m.damage;
      
      player.stats.shotsHit++;
      player.stats.damageDealt += damageDealt;
      
      createHitSpark(m.x, m.y, '#00ffff');
      
      if (e.health <= 0) {
        const scoreGained = Math.floor(e.scoreValue * player.scoreMultiplier);
        player.score += scoreGained;
        player.stats.enemiesKilled++;
        player.stats.creditsEarned += scoreGained;
        if (player.stats.enemyKills[e.type] !== undefined) {
          player.stats.enemyKills[e.type]++;
        }
        enemies.splice(j, 1);
      }
      
      if (m.pierce > 0) {
        m.pierce--;
      } else {
        missileHit = true;
        break;
      }
    }
  }
  
  if (missileHit) {
    homingMissiles.splice(i, 1);
    continue;
  }
  
  for (let bi = bosses.length - 1; bi >= 0; bi--) {
    const B = bosses[bi];
    if (aabbCollide(m, B)) {
      B.health -= m.damage;
      
      createHitSpark(m.x, m.y, '#ffff00');
      
      if (B.health <= 0) {
        const bossReward = Math.floor(1000 * player.scoreMultiplier);
        player.score += bossReward;
        player.stats.bossesDefeated++;
        player.stats.creditsEarned += bossReward;
        
        const defeatedBossType = B.type;
        const defeatedBossIndex = B.bossIndex;
        bosses.splice(bi, 1);
        resetEnemies();
        bossActive = false;
        bossesDefeated++;
        difficultyLevel = 1 + bossesDefeated;
        flashMessage(`Difficulty Level ${difficultyLevel}!`, 2000);
        
        if (defeatedBossType === 'final') {
          showRoundSummary();
          lastBossType = defeatedBossType;
          lastBossIndex = defeatedBossIndex;
        } else {
          lastBossType = defeatedBossType;
          lastBossIndex = defeatedBossIndex;
          openUpgradePopupWithBoss();
        }
        
        return;
      }
      
      if (m.pierce > 0) m.pierce--;
      else {
        missileHit = true;
      }
      break;
    }
  }
  
  if (missileHit) {
    homingMissiles.splice(i, 1);
  }
  
  continue;
}

// Enemy missile collision with player
if (!player.invincible && !player.iframeActive && aabbCollide(m, player)) {
  player.health -= m.damage;
  player.stats.damageTaken += m.damage;
  homingMissiles.splice(i, 1);
  if (player.health <= 0) {
    player.health = 0;
    isGameOver = true;
    return;
  }
  
  if (GAME_CONFIG.IFRAME_ENABLED && !player.iframeActive) {
    player.iframeActive = true;
    player.iframeEnd = Date.now() + GAME_CONFIG.IFRAME_DURATION_MS;
  }
}
}
// Deactivate timed power-ups
if (player.homingMissilesEnd && Date.now() >= player.homingMissilesEnd) {
player.homingMissilesActive = false;
player.homingMissilesEnd = null;
}
if (player.shieldBubbleEnd && Date.now() >= player.shieldBubbleEnd) {
player.shieldBubble = false;
player.shieldBubbleEnd = null;
player.invincible = false;
}
if (player.slowTimeActive && Date.now() >= player.slowTimeEnd) {
player.slowTimeActive = false;
player.slowTimeEnd = null;
}
if (player.ultraDamageEnd && Date.now() >= player.ultraDamageEnd) {
player.bulletDamage = player._originalDamage;
player.ultraDamageEnd = null;
}
// Deactivate i-frames
if (player.iframeActive && Date.now() >= player.iframeEnd) {
player.iframeActive = false;
player.iframeEnd = 0;
}
//Passive health regeneration
if (player.passiveRegen && player.health < player.maxHealth) {
  player.health = Math.min(player.maxHealth, player.health + (player.passiveRegen * (deltaMs / 1000)));
}
updateHitSparks();
  if (!bossActive && !upgradeOpen) {
    const now = Date.now();
    
    // Spawn rate increases with difficulty (enemies spawn faster)
    const spawnRateMultiplier = Math.max(0.5, 1 - (bossesDefeated * 0.1));
    const adjustedSpawnInterval = GAME_CONFIG.ENEMY_SPAWN_MS * spawnRateMultiplier;
    
    if (now - lastEnemySpawnTime >= adjustedSpawnInterval) {
      lastEnemySpawnTime = now;
      
      spawnEnemy({
        bossesDefeated,
        cameraX,
        canvas,
        LEVEL_WIDTH: GAME_CONFIG.LEVEL_WIDTH,
        bossActive,
        upgradeOpen
      });
      
      // Spawn additional enemies at higher difficulties
      if (bossesDefeated > 0 && Math.random() < 0.3 + (bossesDefeated * 0.1)) {
        setTimeout(() => {
          spawnEnemy({
            bossesDefeated,
            cameraX,
            canvas,
            LEVEL_WIDTH: GAME_CONFIG.LEVEL_WIDTH,
            bossActive,
            upgradeOpen
          });
        }, 200);
      }
    }
  }
  
  checkBossesByPosition();
}
/* =========================
Countdown Update
========================= */
function updateCountdown() {
const elapsed = performance.now() - countdownStartTime;
if (elapsed > 1000 && countdownValue > 1) {
countdownValue--;
countdownStartTime = performance.now();
} else if (elapsed > 1000 && countdownValue === 1) {
startActualGameplay();
}
}
/* =========================
Draw Loop
========================= */
function draw() {
  // IMPORTANT: Check orientation warning FIRST (no camera shake during loading/title)
  if (drawOrientationWarning(ctx)) {
    return; // Don't draw anything else if in portrait mode
  }

  // LOADING SCREEN - Draw without camera shake
  if (gameState === 'loading') {
    const progress = getLoadingProgress();
    drawLoadingScreen(ctx, progress);
    
    // Check if loading is complete
    if (areAllAssetsLoaded()) {
      console.log('✅ All assets loaded!');
      gameState = 'title'; // Move to title screen
    }
    return; // Exit early, don't apply camera shake
  }
  
  // TITLE SCREEN - Draw without camera shake
  if (gameState === 'title') {
    drawTitleScreen(ctx, mouse, userHasInteracted);
    return; // Exit early
  }
  
  // GAMEPLAY - Apply camera shake ONLY during gameplay
  ctx.save();
  ctx.translate(cameraShake.offsetX, cameraShake.offsetY);
  
  if (gameState === 'countdown') {
    drawCountdown(ctx, countdownValue);
  } else if (gameState === 'playing') {

// Draw background
if (bgLoaded) {
  const bgScrollSpeed = 0.5;
  const bgScrollX = cameraX * bgScrollSpeed;
  const bgWidth = bgImage.width;
  const offsetX = -(bgScrollX % bgWidth);
  
  for (let x = offsetX; x < canvas.width; x += bgWidth) {
    ctx.drawImage(bgImage, x, 0, bgWidth, canvas.height);
  }
}
else {
  ctx.fillStyle = '#001020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStarfield(ctx, cameraX);
}

// Draw game entities
drawGameEntities(ctx, cameraX);
drawProjectiles(ctx, cameraX);

// Draw HUD
drawHealthBar(ctx);
drawActiveUpgrades(ctx);
drawPowerupInventory(ctx, mouse);

// Round/score info
ctx.fillStyle = '#00ffff';
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'left';
ctx.fillText(`ROUND ${currentRound}`, 20, 60);
ctx.fillStyle = 'white';
ctx.font = '18px Arial';
ctx.textAlign = 'right';
ctx.fillText(`Credits: ${player.score}`, canvas.width - 18, 30);

// Touch controls
drawTouchControls(ctx, touchControls);

// Flash messages
drawFlashMessage(ctx);

// Overlays
if (adState.playing) {
  drawAdOverlay(ctx, adState.remaining);
}

if (upgradeOpen) {
  drawUpgradePopup(ctx, mouse, afterReviveShowUpgrade, lastBossType, lastBossIndex, 
                   currentRound, adState.blockerDetected, adState.failureMessage, 
                   adState.watchInProgress);
}

if (showBattleSummary) {
  drawBattleSummary(ctx, mouse, summaryData);
}

const wheelState = getWheelState();
if (wheelState.show) {
  drawPowerupWheel(ctx, mouse, wheelState.spinning, wheelState.spinAngle, 
                   wheelState.result, wheelState.spinSpeed);
}

if (isPaused && !wheelState.show && !showBattleSummary) {
drawPauseScreen(ctx, mouse);
  }

  if (isGameOver) {
    drawGameOverOverlay(ctx, mouse, adBlockerDetected, adFailureMessage, 
                        ANTI_CHEAT, canWatchReviveAd, msUntilReviveAdAvailable);
  }
} 
  // End of gameplay drawing
  ctx.restore();
}
/* =========================
Main Loop
========================= */
function loop() {
if (gameState === 'title') {
draw();
} else if (gameState === 'countdown') {
updateCountdown();
draw();
} else if (gameState === 'playing') {
update();
draw();
}
requestAnimationFrame(loop);
}
/* =========================
Anti-Cheat Monitoring
========================= */
setInterval(() => {
if (gameState === 'playing' && !isPaused) {
ANTI_CHEAT.detectConsole();
ANTI_CHEAT.checkTimeTravel();
}
}, 5000);
/* =========================
   Initialize Game
========================= */
let gameInitialized = false;

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  initGame();
});

async function initGame() {
  if (gameInitialized) return;
  gameInitialized = true;
  
  console.log('🎮 Adrenaline Assault - Initializing...');
  
  // Start the render loop immediately so loading screen shows
  lastTime = performance.now();
  requestAnimationFrame(loop);
  
  // Wait for assets to load in the background
  await waitForAssets();
  
  // Once assets are loaded, the loop will detect it and move to title screen
  console.log('✅ Game initialized - Adrenaline Assault v1.0');
  console.log('📦 Module system active');
}
/* =========================
Debug Exports (remove in production)
========================= */
window._AA = {
player,
enemies,
bosses,
enemyBullets,
homingMissiles,
restartFull,
spawnEnemy,
spawnBoss,
openUpgradePopupWithBoss,
difficultyLevel,
bossesDefeated,
gameState,
cameraX
};
console.log('🎮 Adrenaline Assault - Main module loaded');
