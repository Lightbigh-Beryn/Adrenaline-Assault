// HUD elements: health, upgrades display, powerup hotbar, boss bar, touch controls, ad/game-over overlays
import { HOTBAR_CONFIG, IS_MOBILE } from './config.js';
import { player } from './player.js';
import { TIMED_POWERUPS } from './upgrades.js';

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
