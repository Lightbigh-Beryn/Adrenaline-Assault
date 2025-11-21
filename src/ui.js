// All UI drawing functions and rendering
import { CANVAS_CONFIG, HOTBAR_CONFIG, IS_MOBILE } from './config.js';
import {
  titleBg, titleBgLoaded, bgImage, bgLoaded,
  shipImage, shipLoaded, enemyShipImages, enemyShipImagesLoaded,
  enemyTypeToImage, bossImages, bossImagesLoaded,
  missileImage, missileImageLoaded, playerMissileImage, playerMissileImageLoaded
} from './assets.js';
import { player } from './player.js';
import { enemies, enemyBullets, ENEMY_TYPES } from './enemies.js';
import { bosses, homingMissiles } from './bosses.js';
import { TIMED_POWERUPS, currentUpgradeChoices } from './upgrades.js';
import { hitSparks } from './weapons.js';

/* =========================
   Canvas Setup
========================= */ 
export function initCanvas() {
  const canvas = document.getElementById('gameCanvas') || (() => {
    const c = document.createElement('canvas');
    c.id = 'gameCanvas';
    document.body.appendChild(c);
    return c;
  })();
  
const resizeCanvas = () => {
  // ✅ ALWAYS keep internal resolution at 1152×648 (NEVER changes)
  canvas.width = CANVAS_CONFIG.width;
  canvas.height = CANVAS_CONFIG.height;

  // Get the game's aspect ratio (16:9)
  const gameAspect = CANVAS_CONFIG.width / CANVAS_CONFIG.height; // 1.7778

  // Get actual screen/window size
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const screenAspect = screenWidth / screenHeight;

  // Decide if we need to scale based on SCREEN SIZE, not device type
  const needsScaling = screenWidth < CANVAS_CONFIG.width || screenHeight < CANVAS_CONFIG.height;

  if (needsScaling) {
    // 📱 SMALL SCREEN: Scale proportionally using CSS transform
    let scale;
    
    if (screenAspect > gameAspect) {
      // Screen is wider than game - fit to height
      scale = screenHeight / CANVAS_CONFIG.height;
    } else {
      // Screen is taller than game - fit to width
      scale = screenWidth / CANVAS_CONFIG.width;
    }

    // Set canvas display size to native resolution
    canvas.style.width = CANVAS_CONFIG.width + 'px';
    canvas.style.height = CANVAS_CONFIG.height + 'px';
    
    // Apply CSS transform to scale it
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'center center';
    
    console.log('📱 Scaled mode - Scale factor:', scale.toFixed(3), 
                'Screen:', screenWidth + '×' + screenHeight);
  } else {
    // 🖥️ LARGE SCREEN: Keep at exact 1152×648 pixels, NO scaling
    canvas.style.width = CANVAS_CONFIG.width + 'px';
    canvas.style.height = CANVAS_CONFIG.height + 'px';
    canvas.style.transform = 'none'; // Remove any transform
    
    console.log('🖥️ Desktop mode - Canvas fixed at:', CANVAS_CONFIG.width + '×' + CANVAS_CONFIG.height,
                'Screen:', screenWidth + '×' + screenHeight);
  }
};

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100); // Delay to let orientation change complete
  });
  
  resizeCanvas(); // Initial resize
  
  return canvas;
}

/* =========================
   Flash Message System
========================= */
let flashMsg = null;
let flashExpire = 0;

export function flashMessage(text, ms = 1000) {
  flashMsg = text;
  flashExpire = performance.now() + ms;
}

function drawFlashMessage(ctx) {
  if (flashMsg && performance.now() < flashExpire) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 50, ctx.canvas.width, 40);
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(flashMsg, ctx.canvas.width / 2, 75);
    ctx.restore();
  }
}
/* =========================
   Loading Screen
========================= */
export function drawLoadingScreen(ctx, progress) {
  ctx.fillStyle = '#000814';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw starfield
  drawStarfield(ctx, 0);
  
  // Title
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20;
  ctx.fillText('ADRENALINE ASSAULT', ctx.canvas.width / 2, ctx.canvas.height / 2 - 80);
  ctx.shadowBlur = 0;
  
  // Loading text
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText('LOADING...', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
  
  // Progress bar background
  const barWidth = 400;
  const barHeight = 30;
  const barX = (ctx.canvas.width - barWidth) / 2;
  const barY = ctx.canvas.height / 2 + 20;
  
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Progress bar fill
  const fillWidth = (barWidth * progress) / 100;
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(barX, barY, fillWidth, barHeight);
  
  // Progress bar border
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  // Percentage text
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  ctx.fillText(`${progress}%`, ctx.canvas.width / 2, barY + barHeight + 30);
}
/* =========================
   Starfield Background
========================= */
export function drawStarfield(ctx, cameraX) {
  ctx.fillStyle = '#000814';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 80; i++) {
    const rx = ((i * 8191) % 3000) / 3000 * ctx.canvas.width - (cameraX * (0.02 * ((i%5)+1)) % ctx.canvas.width);
    const ry = ((i * 4099) % 3000) / 3000 * ctx.canvas.height;
    const r = ((i * 3) % 3) + 1;
    ctx.fillRect(Math.round(rx), Math.round(ry), r, r);
  }
}

/* =========================
   Title Screen
========================= */
export function drawTitleScreen(ctx, mouse, userHasInteracted) {
  if (titleBgLoaded) {
    ctx.drawImage(titleBg, 0, 0, ctx.canvas.width, ctx.canvas.height);
  } else {
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawStarfield(ctx, 0);
  }
  
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20;
  ctx.fillText('ADRENALINE', ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
  ctx.fillText('ASSAULT', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  ctx.fillText('A Space Shooter Adventure', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
  
  const btnW = 240, btnH = 60;
  const btnX = ctx.canvas.width / 2 - btnW / 2;
  const btnY = ctx.canvas.height / 2 + 120;
  const isHovered = (mouse.x >= btnX && mouse.x <= btnX + btnW && 
                     mouse.y >= btnY && mouse.y <= btnY + btnH);
  
  ctx.fillStyle = isHovered ? '#00ff88' : '#00cc66';
  if (isHovered) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 20; }
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('START GAME', ctx.canvas.width / 2, btnY + btnH / 2);
  
  if (!userHasInteracted) {
    ctx.fillStyle = '#ffff00';
    ctx.font = 'italic 16px Arial';
    ctx.fillText('Click start to begin', ctx.canvas.width / 2, btnY + btnH + 30);
  }
  
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px Arial';
  ctx.fillText('WASD or Arrow Keys to Move', ctx.canvas.width / 2, ctx.canvas.height - 55);
  
  ctx.fillStyle = '#666666';
  ctx.font = '14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('v1.0', ctx.canvas.width - 20, ctx.canvas.height - 20);
  
  if (ctx.canvas.width < 800 || ctx.canvas.height < 500) {
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'italic 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💡 Best played in landscape mode', ctx.canvas.width / 2, ctx.canvas.height - 25);
  }
}

/* =========================
   Countdown Screen
========================= */
export function drawCountdown(ctx, countdownValue) {
  ctx.fillStyle = '#001020';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawStarfield(ctx, 0);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pulseAmount = Math.sin(performance.now() / 100) * 10 + 30;
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = pulseAmount;
  ctx.fillText(countdownValue.toString(), ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '32px Arial';
  ctx.fillText('GET READY!', ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
}

/* =========================
   Pause Screen
========================= */
export function drawPauseScreen(ctx, mouse) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20;
  ctx.fillText('PAUSED', ctx.canvas.width / 2, ctx.canvas.height / 2 - 120);
  ctx.shadowBlur = 0;
  
  const btnW = 260, btnH = 70;
  const resumeX = ctx.canvas.width / 2 - btnW / 2;
  const resumeY = ctx.canvas.height / 2 - 20;
  const resumeHovered = (mouse.x >= resumeX && mouse.x <= resumeX + btnW && 
                         mouse.y >= resumeY && mouse.y <= resumeY + btnH);
  
  ctx.fillStyle = resumeHovered ? '#00ff88' : '#00cc66';
  if (resumeHovered) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 20; }
  ctx.fillRect(resumeX, resumeY, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(resumeX, resumeY, btnW, btnH);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('RESUME', ctx.canvas.width / 2, resumeY + btnH / 2);
  
  const quitY = resumeY + btnH + 30;
  const quitHovered = (mouse.x >= resumeX && mouse.x <= resumeX + btnW && 
                       mouse.y >= quitY && mouse.y <= quitY + btnH);
  
  ctx.fillStyle = quitHovered ? '#ff6666' : '#cc4444';
  if (quitHovered) { ctx.shadowColor = '#ff6666'; ctx.shadowBlur = 20; }
  ctx.fillRect(resumeX, quitY, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(resumeX, quitY, btnW, btnH);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('QUIT TO MENU', ctx.canvas.width / 2, quitY + btnH / 2);
  
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '18px Arial';
  ctx.fillText('Press ESC or P to resume', ctx.canvas.width / 2, ctx.canvas.height - 60);
}

/* =========================
   Health Bar
========================= */
export function drawHealthBar(ctx) {
  const marginX = 20, marginY = 20, w = 240, h = 18;
  const x = marginX, y = marginY;
  
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  const pct = Math.max(0, player.health / player.maxHealth);
  ctx.fillStyle = pct > 0.3 ? '#0f0' : '#f33';
  ctx.fillRect(x, y, w * pct, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`HP: ${Math.floor(player.health)}/${player.maxHealth}`, x, y - 1); // FIXED: Added backticks
}

/* =========================
   Active Upgrades Display
========================= */
export function drawActiveUpgrades(ctx) {
  let startX = 280;
  let startY = 28;
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  const upgrades = [];
  
  if (player.spreadShot) upgrades.push('🔱 Spread');
  if (player.doubleShot) upgrades.push('⚡ Double');
  if (player.piercing > 0) upgrades.push(`🎯 Pierce×${player.piercing}`); // FIXED: Added backticks
  if (player._projSpeedInc > 0) upgrades.push(`🚀 Speed+${player._projSpeedInc}`); // FIXED
  if (player._fire_rateLevel > 0) upgrades.push(`⚡ Fire Lv${player._fire_rateLevel}`); // FIXED: Dot notation
  if (player._double_damageLevel > 0) upgrades.push(`💥 Dmg Lv${player._double_damageLevel}`); // FIXED
  if (player._max_healthLevel > 0) upgrades.push(`❤️ HP Lv${player._max_healthLevel}`); // FIXED
  if (player._speed_boostLevel > 0) upgrades.push(`🏃 Spd Lv${player._speed_boostLevel}`); // FIXED
  if (player.passiveRegen > 0) upgrades.push(`💚 Regen+${player.passiveRegen}/s`); // FIXED
  if (player.drone) upgrades.push('🤖 Drone');
  
  ctx.font = '12px Arial';
  ctx.fillStyle = '#00ff88';
  
  if (upgrades.length === 0) {
    ctx.fillStyle = '#888888';
    ctx.fillText('No Upgrades', startX, startY);
  } else {
    upgrades.forEach((upgrade, i) => {
      const text = upgrade;
      const textWidth = ctx.measureText(text).width;
      
      ctx.fillStyle = 'rgba(0, 100, 50, 0.6)';
      ctx.fillRect(startX - 4, startY - 10, textWidth + 8, 18);
      
      ctx.fillStyle = '#00ff88';
      ctx.fillText(text, startX, startY);
      
      startX += textWidth + 12;
      
      if (startX > ctx.canvas.width - 220) {
        startX = 280;
        startY += 22;
      }
    });
  }
  
  ctx.textBaseline = 'alphabetic';
}

/* =========================
   Boss Health Bar
========================= */
export function drawBossBigBar(ctx, boss) {
  const pad = 20;
  const w = ctx.canvas.width - pad * 2; // FIXED: Multiplication
  const h = 20;
  const x = pad;
  const y = ctx.canvas.height - h - pad - 40;
  
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, w, h);
  const pct = Math.max(0, boss.health / boss.maxHealth);
  
  if (boss.enraged) {
    ctx.fillStyle = pct > 0.25 ? '#ff4444' : '#ff0000';
  } else {
    ctx.fillStyle = pct > 0.3 ? '#0f0' : '#f33';
  }
  
  ctx.fillRect(x, y, Math.round(w * pct), h);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  const statusText = boss.enraged ? ' [ENRAGED]' : '';
  ctx.fillText(`${boss.type.toUpperCase()} HP: ${Math.max(0, Math.floor(boss.health))}${statusText}`, x + 8, y + 14); // FIXED: Added backticks
  
  ctx.fillStyle = '#ff0000';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ BOSS FIGHT ⚠', ctx.canvas.width / 2, y - 10);
}

/* =========================
   Powerup Hotbar
========================= */
export function drawPowerupInventory(ctx, mouse) {
  const powerupArray = Object.entries(TIMED_POWERUPS);
  const totalWidth = (powerupArray.length * HOTBAR_CONFIG.SLOT_SIZE) + ((powerupArray.length - 1) * HOTBAR_CONFIG.SPACING);
  const startX = (ctx.canvas.width - totalWidth) / 2;
  const startY = ctx.canvas.height - HOTBAR_CONFIG.SLOT_SIZE - HOTBAR_CONFIG.BOTTOM_MARGIN;
  
  powerupArray.forEach(([id, powerup], index) => {
    const slotX = startX + (index * (HOTBAR_CONFIG.SLOT_SIZE + HOTBAR_CONFIG.SPACING));
    const slotY = startY;
    const count = player.powerups[id] || 0;
    const isActive = player[id + 'End'] && Date.now() < player[id + 'End'];
    const isHovered = (mouse.x >= slotX && mouse.x <= slotX + HOTBAR_CONFIG.SLOT_SIZE && 
                       mouse.y >= slotY && mouse.y <= slotY + HOTBAR_CONFIG.SLOT_SIZE);
    
    if (isActive) {
      ctx.save();
      const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
      const glowColors = {
        homingMissiles: '#00ffff',
        shieldBubble: '#ffff00',
        slowTime: '#ff00ff',
        ultraDamage: '#ff4400'
      };
      ctx.shadowColor = glowColors[id] || '#ffffff';
      ctx.shadowBlur = 20 * pulse;
      ctx.strokeStyle = glowColors[id] || '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(slotX - 4, slotY - 4, HOTBAR_CONFIG.SLOT_SIZE + 8, HOTBAR_CONFIG.SLOT_SIZE + 8);
      ctx.restore();
    }
    
    ctx.fillStyle = count > 0 ? 'rgba(0, 100, 50, 0.7)' : 'rgba(40, 40, 40, 0.7)';
    if (isHovered && count > 0) {
      ctx.fillStyle = 'rgba(0, 150, 75, 0.9)';
    }
    ctx.fillRect(slotX, slotY, HOTBAR_CONFIG.SLOT_SIZE, HOTBAR_CONFIG.SLOT_SIZE);
    
    ctx.strokeStyle = isActive ? '#ffff00' : (count > 0 ? '#00ff88' : '#666666');
    ctx.lineWidth = 2;
    ctx.strokeRect(slotX, slotY, HOTBAR_CONFIG.SLOT_SIZE, HOTBAR_CONFIG.SLOT_SIZE);
    
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = count > 0 ? '#ffffff' : '#444444';
    ctx.fillText(powerup.icon, slotX + HOTBAR_CONFIG.SLOT_SIZE / 2, slotY + HOTBAR_CONFIG.SLOT_SIZE / 2);
    
    if (count > 0) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`x${count}`, slotX + HOTBAR_CONFIG.SLOT_SIZE - 4, slotY + HOTBAR_CONFIG.SLOT_SIZE - 4); // FIXED: Added backticks
      ctx.fillText(`x${count}`, slotX + HOTBAR_CONFIG.SLOT_SIZE - 4, slotY + HOTBAR_CONFIG.SLOT_SIZE - 4); // FIXED
    }
    
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(powerup.key, slotX + 3, slotY + 3);
    ctx.fillText(powerup.key, slotX + 3, slotY + 3);
    
    if (isActive) {
      const remaining = Math.ceil((player[id + 'End'] - Date.now()) / 1000);
      const glowColors = {
        homingMissiles: '#00ffff',
        shieldBubble: '#ffff00',
        slowTime: '#ff00ff',
        ultraDamage: '#ff4400'
      };
      
      ctx.save();
      ctx.shadowColor = glowColors[id] || '#ffffff';
      ctx.shadowBlur = 10;
      
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = glowColors[id] || '#ffffff';
      ctx.fillText(`${remaining}s`, slotX + HOTBAR_CONFIG.SLOT_SIZE / 2, slotY - 18); // FIXED: Added backticks
      
      ctx.font = '12px Arial';
      ctx.fillText(powerup.name.replace('\n', ' '), slotX + HOTBAR_CONFIG.SLOT_SIZE / 2, slotY - 4);
      
      ctx.restore();
    }
  });
}

/* =========================
   Game Over Screen
========================= */
export function drawGameOverOverlay(ctx, mouse, adBlockerDetected, adFailureMessage, ANTI_CHEAT, canWatchReviveAd, msUntilReviveAdAvailable) {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  if (adBlockerDetected || adFailureMessage) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.fillRect(ctx.canvas.width / 2 - 300, 80, 600, 70);
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(ctx.canvas.width / 2 - 300, 80, 600, 70);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ WARNING ⚠', ctx.canvas.width / 2, 105);
    
    ctx.font = '16px Arial';
    const message = adFailureMessage || 'Ad blocker detected! Disable to use ad continue.';
    ctx.fillText(message, ctx.canvas.width / 2, 130);
  }
  
  if (ANTI_CHEAT.consoleDetected) {
    ctx.fillStyle = 'rgba(255, 100, 0, 0.9)';
    ctx.fillRect(50, 160, ctx.canvas.width - 100, 50);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 160, ctx.canvas.width - 100, 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ Console tampering detected - Ad rewards disabled', ctx.canvas.width / 2, 190);
  }
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2 - 160);
  ctx.font = '28px Arial';
  ctx.fillText(`Final Score: ${player.score}`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 110); // FIXED: Added backticks
  
  const centerX = ctx.canvas.width / 2;
  const baseY = ctx.canvas.height / 2 - 40;
  const rbW = 220, rbH = 62;
  const rbX = centerX - rbW / 2;
  const rbY = baseY;
  const abW = 340, abH = 62;
  const abX = centerX - abW / 2;
  const abY = baseY + 100;
  
  const restartHover = (mouse.x >= rbX && mouse.x <= rbX + rbW && mouse.y >= rbY && mouse.y <= rbY + rbH);
  ctx.fillStyle = restartHover ? '#00ffff' : '#00bfff';
  ctx.fillRect(rbX, rbY, rbW, rbH);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(rbX, rbY, rbW, rbH);
  ctx.fillStyle = '#fff';
  ctx.font = '22px Arial';
  ctx.fillText('Restart', rbX + rbW/2, rbY + rbH/2 + 8);
  
  const adAvailable = canWatchReviveAd();
  const adHover = (mouse.x >= abX && mouse.x <= abX + abW && mouse.y >= abY && mouse.y <= abY + abH);
  if (adAvailable) {
    ctx.fillStyle = adHover ? '#55ff88' : '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = adHover ? 30 : 10;
  } else {
    ctx.fillStyle = '#444';
    ctx.shadowBlur = 0;
  }
  ctx.fillRect(abX, abY, abW, abH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(abX, abY, abW, abH);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Watch Ad to Continue', abX + abW/2, abY + abH/2 + 8);
  
  if (!adAvailable) {
    const rem = msUntilReviveAdAvailable();
    const hrs = Math.floor(rem / (1000*60*60)); // FIXED: Proper multiplication
    const mins = Math.floor((rem % (1000*60*60)) / (1000*60)); // FIXED
    const secs = Math.floor((rem % (1000*60)) / 1000); // FIXED
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText(`Revive available in ${hrs}h ${mins}m ${secs}s`, ctx.canvas.width / 2, abY + abH + 34); // FIXED: Added backticks
  }
}

/* =========================
   Ad Playing Overlay
========================= */
export function drawAdOverlay(ctx, adRemaining) {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 10;
  ctx.fillText('AD PLAYING...', ctx.canvas.width/2, ctx.canvas.height/2 - 40);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 64px Arial';
  ctx.fillText(`${adRemaining}`, ctx.canvas.width/2, ctx.canvas.height/2 + 40); // FIXED: Added backticks
  
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '18px Arial';
  ctx.fillText('(Simulated ad for debugging)', ctx.canvas.width/2, ctx.canvas.height/2 + 100);
}

/* =========================
   Touch Controls Indicator
========================= */
export function drawTouchControls(ctx, touchControls) {
  if (!IS_MOBILE || !touchControls.active) return;
  
  const centerX = touchControls.startX;
  const centerY = touchControls.startY;
  const touchX = touchControls.currentX;
  const touchY = touchControls.currentY;
  
  ctx.save();
  ctx.globalAlpha = 0.5; // Changed from 0.3 to make it more visible
  
  // Outer circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Inner circle (touch point)
  ctx.beginPath();
  ctx.arc(touchX, touchY, 25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Line from center to touch
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(touchX, touchY);
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  ctx.restore();
}

/* =========================
   Main Game Drawing (Part 1 - Entities)
========================= */
export function drawGameEntities(ctx, cameraX) {
  // Draw enemies
  enemies.forEach(e => {
    const sx = Math.round(e.x - cameraX);
    const imageKey = enemyTypeToImage[e.type];
    
    if (imageKey && enemyShipImagesLoaded[imageKey]) {
      ctx.drawImage(enemyShipImages[imageKey], sx, Math.round(e.y), e.width, e.height);
      
      if (e.isKamikaze) {
        const pulse = Math.sin(e.pulseTime * 0.3) * 0.5 + 0.5;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15 * pulse;
        ctx.drawImage(enemyShipImages[imageKey], sx, Math.round(e.y), e.width,
        e.height);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', sx + e.width / 2, Math.round(e.y) + e.height / 2 + 5);
      }
    } else {
      if (e.isKamikaze) {
        const pulse = Math.sin(e.pulseTime * 0.3) * 0.5 + 0.5;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15 * pulse;
        ctx.fillStyle = e.color;
        ctx.fillRect(sx, Math.round(e.y), e.width, e.height);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', sx + e.width / 2, Math.round(e.y) + e.height / 2 + 5);
      } else {
        ctx.fillStyle = e.color;
        ctx.fillRect(sx, Math.round(e.y), e.width, e.height);
      }
    }
  });

  // Draw bosses
  if (bosses.length > 0) {
    const B = bosses[0];
    drawBossBigBar(ctx, B);
    const sx = Math.round(B.x - cameraX);
    
    if (B.enraged) {
      const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 30 * pulse;
    }
    
    if (bossImagesLoaded[B.type]) {
      ctx.drawImage(bossImages[B.type], sx, Math.round(B.y), B.width, B.height);
    } else {
      ctx.fillStyle = B.color;
      ctx.fillRect(sx, Math.round(B.y), B.width, B.height);
    }
    
    ctx.shadowBlur = 0;
    
    if (B.enraged) {
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚠', sx + B.width / 2, Math.round(B.y) - 15);
    }
  }

  // Draw player
  const psx = Math.round(player.x - cameraX);
  
  if (player.iframeActive) {
    ctx.save();
    const pulse = Math.sin(Date.now() / 150) * 0.4 + 0.6;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 30 * pulse;
    
    if (shipLoaded) {
      ctx.drawImage(shipImage, psx, Math.round(player.y), player.width, player.height);
    } else {
      ctx.fillStyle = player.color;
      ctx.fillRect(psx, Math.round(player.y), player.width, player.height);
    }
    ctx.restore();
    
    const remaining = Math.ceil((player.iframeEnd - Date.now()) / 1000);
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`PROTECTED`, psx + player.width / 2, Math.round(player.y) - 25); // FIXED: Added backticks
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${remaining}`, psx + player.width / 2, Math.round(player.y) - 5); // FIXED: Added backticks
    ctx.restore();
  } else {
    if (shipLoaded) {
      ctx.drawImage(shipImage, psx, Math.round(player.y), player.width, player.height);
    } else {
      ctx.fillStyle = player.color;
      ctx.fillRect(psx, Math.round(player.y), player.width, player.height);
    }
  }
}

/* =========================
   Main Game Drawing (Part 2 - Projectiles)
========================= */
export function drawProjectiles(ctx, cameraX) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Player bullets
  player.bullets.forEach(b => {
    const sx = b.x - cameraX;
    const sy = b.y;
    const len = b.length || 40;

    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const dx = b.vx / speed;
    const dy = b.vy / speed;

    const tailX = sx - dx * len;
    const tailY = sy - dy * len;

    const grad = ctx.createLinearGradient(tailX, tailY, sx, sy);
    grad.addColorStop(0, 'rgba(0,255,255,0)');
    grad.addColorStop(0.3, 'rgba(0,255,255,0.4)');
    grad.addColorStop(0.7, 'rgba(0,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const pulse = 0.8 + Math.sin(Date.now() / 80) * 0.2;
    ctx.lineWidth *= pulse;

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(sx, sy);
    ctx.stroke();
  });

  // Enemy bullets
  enemyBullets.forEach(b => {
    const sx = b.x - cameraX;
    const sy = b.y;
    const len = b.length || 35;

    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const dx = b.vx / speed;
    const dy = b.vy / speed;

    const tailX = sx - dx * len;
    const tailY = sy - dy * len;

    const grad = ctx.createLinearGradient(tailX, tailY, sx, sy);
    grad.addColorStop(0, 'rgba(255,80,0,0)');
    grad.addColorStop(0.3, 'rgba(255,150,0,0.4)');
    grad.addColorStop(0.7, 'rgba(255,200,0,0.8)');
    grad.addColorStop(1, 'rgba(255,255,200,1)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const pulse = 0.8 + Math.sin(Date.now() / 80) * 0.2;
    ctx.lineWidth *= pulse;

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(sx, sy);
    ctx.stroke();
  });

  ctx.restore();

  // Hit sparks
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  hitSparks.forEach(spark => {
    const sx = spark.x - cameraX;
    const sy = spark.y;
    const alpha = spark.life / spark.maxLife;
    const size = 8 * alpha;
    
    ctx.fillStyle = spark.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowColor = spark.color;
    ctx.shadowBlur = 15 * alpha;
    ctx.beginPath();
    ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Homing missiles
  homingMissiles.forEach(m => {
    const sx = m.x - cameraX;
    const sy = m.y;

    if (m.trail && m.trail.length > 2) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(m.trail[0].x - cameraX, m.trail[0].y);
      for (let t = 1; t < m.trail.length; t++) {
        const p = m.trail[t];
        ctx.lineTo(p.x - cameraX, p.y);
      }

      const grad = ctx.createLinearGradient(
        m.trail[m.trail.length - 1].x - cameraX,
        m.trail[m.trail.length - 1].y,
        m.trail[0].x - cameraX,
        m.trail[0].y
      );
      
      if (m.isPlayerMissile) {
        grad.addColorStop(0, 'rgba(0,255,255,0)');
        grad.addColorStop(0.5, 'rgba(0,200,255,0.5)');
        grad.addColorStop(1, 'rgba(0,255,255,0.9)');
      } else {
        grad.addColorStop(0, 'rgba(255,150,50,0)');
        grad.addColorStop(0.5, 'rgba(255,200,100,0.4)');
        grad.addColorStop(1, 'rgba(255,255,200,0.9)');
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(sx, sy);
    const angle = Math.atan2(m.vy, m.vx);
    ctx.rotate(angle);

    if (m.isPlayerMissile && playerMissileImageLoaded) {
      ctx.drawImage(playerMissileImage, -m.width / 2, -m.height / 2, m.width, m.height);
    } else if (!m.isPlayerMissile && missileImageLoaded) {
      ctx.drawImage(missileImage, -m.width / 2, -m.height / 2, m.width, m.height);
    } else {
      ctx.fillStyle = m.isPlayerMissile ? '#00ffff' : '#ccc';
      ctx.fillRect(-8, -2, 16, 4);

      const grad = ctx.createLinearGradient(-14, 0, -4, 0);
      if (m.isPlayerMissile) {
        grad.addColorStop(0, 'rgba(0,255,255,0.9)');
        grad.addColorStop(1, 'rgba(0,100,255,0)');
      } else {
        grad.addColorStop(0, 'rgba(255,180,0,0.9)');
        grad.addColorStop(1, 'rgba(255,0,0,0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-8, -3);
      ctx.lineTo(-8, 3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  });
}
/* =========================
   Mobile Orientation Warning
========================= */
export function drawOrientationWarning(ctx) {
  console.log('Checking orientation - IS_MOBILE:', IS_MOBILE, 
              'Width:', window.innerWidth, 'Height:', window.innerHeight);
  
  if (!IS_MOBILE) return false;
  
  // Check if portrait mode (height > width)
  const isPortrait = window.innerHeight > window.innerWidth;
  
  console.log('Is Portrait:', isPortrait);
  
  if (isPortrait) {
    // Fill entire canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    
    // Rotate icon
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2 - 60);
    ctx.rotate(Math.PI / 2);
    ctx.font = 'bold 80px Arial';
    ctx.fillText('📱', 0, 0);
    ctx.restore();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Please rotate your device', ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
    ctx.font = '24px Arial';
    ctx.fillText('to landscape mode', ctx.canvas.width / 2, ctx.canvas.height / 2 + 80);
    
    ctx.fillStyle = '#ffff00';
    ctx.font = '20px Arial';
    ctx.fillText('for the best experience', ctx.canvas.width / 2, ctx.canvas.height / 2 + 120);
    
    return true;
  }
  return false;
}
/* =========================
   Export main draw function
========================= */
export { drawFlashMessage };