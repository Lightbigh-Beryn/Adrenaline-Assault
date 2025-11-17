// Menu screens, popups, and overlay UI
import { player } from './player.js';
import { currentUpgradeChoices } from './upgrades.js';
import { ENEMY_TYPES } from './enemies.js';
import { powerupPool } from './upgrades.js';
import { canWatchBossAd, msUntilBossAdAvailable } from './ads.js';

/* =========================
   Upgrade Popup
========================= */
export function drawUpgradePopup(ctx, mouse, afterReviveShowUpgrade, lastBossType, lastBossIndex, currentRound, adBlockerDetected, adFailureMessage, adWatchInProgress) {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  if (adBlockerDetected || adFailureMessage) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.fillRect(0, 40, ctx.canvas.width, 80);
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 40, ctx.canvas.width, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ WARNING ⚠', ctx.canvas.width / 2, 70);
    
    ctx.font = '18px Arial';
    const message = adFailureMessage || 'Ad blocker or extension detected!';
    ctx.fillText(message, ctx.canvas.width / 2, 100);
    
    if (adFailureMessage && !adBlockerDetected) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#ffff00';
      ctx.fillText('(Click anywhere to dismiss)', ctx.canvas.width / 2, 115);
    }
  }
  
  const w = Math.min(720, ctx.canvas.width - 120);
  const boxX = (ctx.canvas.width - w) / 2;
  const startY = ctx.canvas.height / 2 - 150;
  
  ctx.fillStyle = 'white';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Upgrade Shop', ctx.canvas.width / 2, startY - 40);
  ctx.font = '18px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.fillText(`Credits: ${player.score}`, ctx.canvas.width / 2, startY - 10); // FIXED: Added backticks
  
  const btnH = 64;
  currentUpgradeChoices.forEach((opt, i) => {
    const bx = boxX;
    const by = startY + i * (btnH + 14);
    const isPurchased = opt.purchased;
    
    let bgColor;
    if (isPurchased) bgColor = '#228822';
    else if (mouse.x >= bx && mouse.x <= bx + w && mouse.y >= by && mouse.y <= by + btnH) bgColor = '#00bfff';
    else bgColor = '#004f5f';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(bx, by, w, btnH);
    ctx.strokeStyle = isPurchased ? '#44ff44' : '#fff';
    ctx.lineWidth = isPurchased ? 3 : 2;
    ctx.strokeRect(bx, by, w, btnH);
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const statusText = isPurchased ? ' ✓ PURCHASED' : ` (${opt.cost} credits)`; // FIXED: Added backticks
    ctx.fillText(`${opt.displayName || opt.name}${statusText}`, bx + 14, by + 28); // FIXED: Added backticks
    ctx.font = '14px Arial';
    ctx.fillText(opt.desc, bx + 14, by + 46);
    
    if (player.score < opt.cost && !isPurchased) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, w, btnH);
      ctx.fillStyle = '#ffdddd';
      ctx.font = '14px Arial';
      ctx.fillText('Not enough credits', bx + w - 160, by + btnH/2 + 6);
    }
  });
  
  if (!afterReviveShowUpgrade && lastBossType && lastBossIndex >= 0) {
    const adY = startY + currentUpgradeChoices.length * (btnH + 14) + 20;
    const adAvailable = canWatchBossAd(currentRound, lastBossIndex) && !adWatchInProgress;
    
    if (lastBossType === 'mini') {
      const adW = 320, adH = 50;
      const adX = ctx.canvas.width / 2 - adW / 2;
      const adHovered = (mouse.x >= adX && mouse.x <= adX + adW && mouse.y >= adY && mouse.y <= adY + adH);
      
      ctx.fillStyle = adAvailable ? (adHovered ? '#44ff44' : '#22aa22') : '#444444';
      ctx.fillRect(adX, adY, adW, adH);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(adX, adY, adW, adH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      
      if (adWatchInProgress) {
        ctx.fillText('📺 Ad In Progress...', ctx.canvas.width / 2, adY + adH / 2 + 6);
      } else if (canWatchBossAd(currentRound, lastBossIndex)) {
        ctx.fillText('📺 Watch Ad for 2000 Credits', ctx.canvas.width / 2, adY + adH / 2 + 6);
      } else {
        ctx.fillText('📺 Ad on Cooldown', ctx.canvas.width / 2, adY + adH / 2 + 6);
      }
      
      if (!adAvailable && !adWatchInProgress) {
        const rem = msUntilBossAdAvailable(currentRound, lastBossIndex);
        const hrs = Math.floor(rem / (1000*60*60));
        const mins = Math.floor((rem % (1000*60*60)) / (1000*60));
        ctx.font = '14px Arial';
        ctx.fillText(`Available in ${hrs}h ${mins}m`, ctx.canvas.width / 2, adY + adH + 20); // FIXED: Added backticks
      }
    }
    
    if (lastBossType === 'final') {
      const adW = 360, adH = 50;
      const adX = ctx.canvas.width / 2 - adW / 2;
      const adHovered = (mouse.x >= adX && mouse.x <= adX + adW && mouse.y >= adY && mouse.y <= adY + adH);
      
      ctx.fillStyle = adAvailable ? (adHovered ? '#ff44ff' : '#aa22aa') : '#444444';
      ctx.fillRect(adX, adY, adW, adH);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(adX, adY, adW, adH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      
      if (adWatchInProgress) {
        ctx.fillText('📺 Ad In Progress...', ctx.canvas.width / 2, adY + adH / 2 + 6);
      } else if (canWatchBossAd(currentRound, lastBossIndex)) {
        ctx.fillText('📺 Watch Ad for SPECIAL POWER!', ctx.canvas.width / 2, adY + adH / 2 + 6);
      } else {
        ctx.fillText('📺 Ad on Cooldown', ctx.canvas.width / 2, adY + adH / 2 + 6);
      }
      
      if (!adAvailable && !adWatchInProgress) {
        const rem = msUntilBossAdAvailable(currentRound, lastBossIndex);
        const hrs = Math.floor(rem / (1000*60*60));
        const mins = Math.floor((rem % (1000*60*60)) / (1000*60));
        ctx.font = '14px Arial';
        ctx.fillText(`Available in ${hrs}h ${mins}m`, ctx.canvas.width / 2, adY + adH + 20); // FIXED: Added backticks
      }
    }
  }
  
  const skipW = 200, skipH = 50;
  const skipX = ctx.canvas.width / 2 - skipW / 2;
  const skipY = startY + currentUpgradeChoices.length * (btnH + 14) + 
                (lastBossType && !afterReviveShowUpgrade ? 85 : 25);
  const skipHovered = (mouse.x >= skipX && mouse.x <= skipX + skipW && mouse.y >= skipY && mouse.y <= skipY + skipH);
  
  ctx.fillStyle = skipHovered ? '#00ff88' : '#00aa55';
  ctx.fillRect(skipX, skipY, skipW, skipH);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.strokeRect(skipX, skipY, skipW, skipH);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CONTINUE', skipX + skipW/2, skipY + skipH/2 + 7);
}

/* =========================
   Battle Summary Screen
========================= */
export function drawBattleSummary(ctx, mouse, summaryData) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  const centerX = ctx.canvas.width / 2;
  const startY = 80;
  
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20;
  ctx.fillText('ROUND COMPLETE', centerX, startY);
  ctx.shadowBlur = 0;
  
  const ratingColor = {
    'S': '#ffff00',
    'A': '#00ff00',
    'B': '#00aaff',
    'C': '#ff8800',
    'D': '#ff4444'
  }[summaryData.rating];
  
  ctx.fillStyle = ratingColor;
  ctx.font = 'bold 72px Arial';
  ctx.fillText(summaryData.rating, centerX, startY + 80);
  ctx.font = '20px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Performance Rating', centerX, startY + 110);
  
  const boxY = startY + 140;
  const boxW = 600;
  const boxH = 280;
  const boxX = centerX - boxW / 2;
  
  ctx.fillStyle = 'rgba(20, 40, 60, 0.8)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  
  ctx.textAlign = 'left';
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#ffff00';
  
  const leftCol = boxX + 30;
  const rightCol = boxX + boxW / 2 + 20;
  let lineY = boxY + 35;
  const lineSpacing = 32;
  
  ctx.fillText(`Round: ${summaryData.round}`, leftCol, lineY); // FIXED: Added backticks
  lineY += lineSpacing;
  ctx.fillText(`Difficulty: Level ${summaryData.difficulty}`, leftCol, lineY); // FIXED: Added backticks
  lineY += lineSpacing;
  ctx.fillText(`Time: ${formatTime(summaryData.duration)}`, leftCol, lineY); // FIXED: Added backticks
  lineY += lineSpacing;
  ctx.fillText(`Credits Earned: ${summaryData.stats.creditsEarned}`, leftCol, lineY); // FIXED: Added backticks
  lineY += lineSpacing;
  ctx.fillText(`Accuracy: ${summaryData.accuracy}%`, leftCol, lineY); // FIXED: Added backticks
  lineY += lineSpacing;
  ctx.fillText(`Damage Dealt: ${summaryData.stats.damageDealt}`, leftCol, lineY); // FIXED: Added backticks
  lineY += lineSpacing;
  ctx.fillText(`Damage Taken: ${summaryData.stats.damageTaken}`, leftCol, lineY); // FIXED: Added backticks
  
  lineY = boxY + 35;
  ctx.fillStyle = '#00ff88';
  ctx.fillText('Enemies Destroyed:', rightCol, lineY);
  lineY += lineSpacing;
  
  ctx.font = '16px Arial';
  ctx.fillStyle = '#ffffff';
  Object.entries(summaryData.stats.enemyKills).forEach(([type, count]) => {
    if (count > 0) {
      const typeName = ENEMY_TYPES[type].name;
      ctx.fillText(`${typeName}: ${count}`, rightCol + 10, lineY); // FIXED: Added backticks
      lineY += 26;
    }
  });
  
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.fillText(`Total: ${summaryData.stats.enemiesKilled}`, rightCol + 10, lineY); // FIXED: Added backticks
  lineY += lineSpacing;
  ctx.fillText(`Bosses: ${summaryData.stats.bossesDefeated}`, rightCol + 10, lineY); // FIXED: Added backticks
  
  const contBtnY = boxY + boxH + 30;
  const contBtnW = 280;
  const contBtnH = 60;
  const contBtnX = centerX - contBtnW / 2;
  const contBtnHovered = (mouse.x >= contBtnX && mouse.x <= contBtnX + contBtnW && 
                          mouse.y >= contBtnY && mouse.y <= contBtnY + contBtnH);
  
  ctx.fillStyle = contBtnHovered ? '#00ff88' : '#00aa55';
  if (contBtnHovered) {
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20;
  }
  ctx.fillRect(contBtnX, contBtnY, contBtnW, contBtnH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(contBtnX, contBtnY, contBtnW, contBtnH);
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CONTINUE', centerX, contBtnY + contBtnH / 2 + 8);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`; // FIXED: Added backticks
}

/* =========================
   Powerup Wheel
========================= */
export function drawPowerupWheel(ctx, mouse, spinning, spinAngle, spinResult, spinSpeed) {
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  
  const cx = ctx.canvas.width / 2;
  const cy = ctx.canvas.height / 2;
  const radius = 140;
  
  for (let i = 0; i < powerupPool.length; i++) {
    const startAngle = (i / powerupPool.length) * Math.PI * 2 + spinAngle - Math.PI / 2;
    const endAngle = ((i + 1) / powerupPool.length) * Math.PI * 2 + spinAngle - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = ["#ff6666", "#66ccff", "#66ff99", "#ffcc66"][i];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((startAngle + endAngle) / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#000";
    
    const name = powerupPool[i].name;
    const words = name.split('\n');
    
    ctx.font = "bold 16px Arial";
    
    if (words.length === 2) {
      ctx.fillText(words[0], radius * 0.6, -6);
      ctx.fillText(words[1], radius * 0.6, 10);
    } else {
      ctx.fillText(name, radius * 0.6, 2);
    }
    ctx.restore();
  }
  
  ctx.save();
  ctx.translate(cx, cy - radius - 10);
  ctx.fillStyle = "#ffff00";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-15, -25);
  ctx.lineTo(15, -25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.fillStyle = "#00ffff";
  ctx.textAlign = "center";
  ctx.font = "bold 32px Arial";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 10;
  ctx.fillText("POWER-UP WHEEL", cx, cy - radius - 65);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  
  if (!spinning && !spinResult) {
    ctx.fillText("Spin to get a random power-up!", cx, cy - radius - 40);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffff00";
    ctx.fillText("[Press SPACE or ENTER to Spin]", cx, cy + radius + 50);
  } else if (spinning) {
    ctx.fillText("Spinning...", cx, cy - radius - 90);
  } else if (spinResult) {
    ctx.fillStyle = "#00ff00";
    ctx.font = "bold 24px Arial";
    ctx.fillText(
      `You won: ${spinResult.name} ×${spinResult.count}!`, // FIXED: Added backticks
      cx,
      cy - radius - 100
    );
    
    const adBtnY = cy + radius + 65;
    const adBtnW = 320;
    const adBtnH = 45;
    const adBtnX = cx - adBtnW / 2;
    const adBtnHovered = (mouse.x >= adBtnX && mouse.x <= adBtnX + adBtnW && 
                          mouse.y >= adBtnY && mouse.y <= adBtnY + adBtnH);
    
    ctx.fillStyle = adBtnHovered ? '#ff8800' : '#ff6600';
    if (adBtnHovered) {
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 20;
    }
    ctx.fillRect(adBtnX, adBtnY, adBtnW, adBtnH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(adBtnX, adBtnY, adBtnW, adBtnH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('📺 Watch Ad to Double Reward', cx, adBtnY + adBtnH / 2 + 7);
    
    const startBtnY = adBtnY + adBtnH + 15;
    const startBtnW = 300;
    const startBtnH = 60;
    const startBtnX = cx - startBtnW / 2;
    const startBtnHovered = (mouse.x >= startBtnX && mouse.x <= startBtnX + startBtnW && 
                             mouse.y >= startBtnY && mouse.y <= startBtnY + startBtnH);
    
    ctx.fillStyle = startBtnHovered ? '#00ff88' : '#00cc66';
    if (startBtnHovered) {
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 20;
    }
    ctx.fillRect(startBtnX, startBtnY, startBtnW, startBtnH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(startBtnX, startBtnY, startBtnW, startBtnH);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('START ROUND', cx, startBtnY + startBtnH / 2 + 9);
  }
}