// Screen states: canvas setup, loading, title, countdown, pause, orientation warning, flash messages
import { CANVAS_CONFIG } from './config.js';
import { titleBg, titleBgLoaded } from './assets.js';

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
export function getSettingsGearBounds(ctx) {
  const size = 44;
  return { x: ctx.canvas.width - size - 16, y: 16, w: size, h: size };
}

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

  // Settings gear button (top-right)
  const gear = getSettingsGearBounds(ctx);
  const gearHovered = (mouse.x >= gear.x && mouse.x <= gear.x + gear.w &&
                        mouse.y >= gear.y && mouse.y <= gear.y + gear.h);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = gearHovered ? 'rgba(0, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(gear.x, gear.y, gear.w, gear.h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = gearHovered ? '#00ffff' : '#ffffff';
  ctx.lineWidth = gearHovered ? 3 : 2;
  ctx.strokeRect(gear.x, gear.y, gear.w, gear.h);
  ctx.fillStyle = gearHovered ? '#00ffff' : '#ffffff';
  ctx.font = '26px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚙', gear.x + gear.w / 2, gear.y + gear.h / 2 + 2);
  ctx.restore();
}

/* =========================
   Settings Screen
========================= */
export function getSettingsLayout(ctx) {
  const panelW = 480, panelH = 540;
  const panelX = ctx.canvas.width / 2 - panelW / 2;
  const panelY = ctx.canvas.height / 2 - panelH / 2;

  const rowH = 60;
  const rowX = panelX + 30;
  const rowW = panelW - 60;
  const firstRowY = panelY + 80;

  const toggleW = 90, toggleH = 36;

  const backW = 160, backH = 50;
  const backX = ctx.canvas.width / 2 - backW / 2;
  const backY = panelY + panelH - 65;

  return {
    panelX, panelY, panelW, panelH,
    fullscreenRowY: firstRowY,
    rotateRowY: firstRowY + rowH,
    controlSideRowY: firstRowY + rowH * 2,
    soundRowY: firstRowY + rowH * 3,
    musicRowY: firstRowY + rowH * 4,
    graphicsRowY: firstRowY + rowH * 5,
    rowX, rowW,
    toggleX: rowX + rowW - toggleW, toggleW, toggleH,
    backX, backY, backW, backH
  };
}

export function drawSettingsScreen(ctx, mouse, settings) {
  ctx.fillStyle = 'rgba(0, 8, 20, 0.92)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const L = getSettingsLayout(ctx);

  ctx.fillStyle = 'rgba(10, 20, 35, 0.95)';
  ctx.fillRect(L.panelX, L.panelY, L.panelW, L.panelH);
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(L.panelX, L.panelY, L.panelW, L.panelH);

  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SETTINGS', ctx.canvas.width / 2, L.panelY + 40);

  const drawToggleRow = (label, rowY, isOn, enabled) => {
    ctx.fillStyle = enabled ? '#ffffff' : '#666666';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, L.rowX, rowY);

    const tx = L.toggleX, ty = rowY - L.toggleH / 2, tw = L.toggleW, th = L.toggleH;
    const hovered = enabled && mouse.x >= tx && mouse.x <= tx + tw && mouse.y >= ty && mouse.y <= ty + th;

    ctx.fillStyle = !enabled ? 'rgba(255,255,255,0.08)' : (isOn ? '#00cc66' : 'rgba(255,255,255,0.15)');
    if (hovered) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 12; }
    ctx.fillRect(tx, ty, tw, th);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = enabled ? '#ffffff' : '#555555';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, ty, tw, th);

    ctx.fillStyle = enabled ? (isOn ? '#000000' : '#ffffff') : '#888888';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(enabled ? (isOn ? 'ON' : 'OFF') : 'SOON', tx + tw / 2, ty + th / 2 + 1);
  };

  drawToggleRow('Fullscreen', L.fullscreenRowY, settings.fullscreenEnabled, true);
  drawToggleRow('Suggest Landscape (mobile)', L.rotateRowY, settings.wantRotateHint, true);

  // Control side selector (Left/Right, not a simple on/off)
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Thumb Controls Side', L.rowX, L.controlSideRowY);

  const csx = L.toggleX, csy = L.controlSideRowY - L.toggleH / 2, cstw = L.toggleW, csth = L.toggleH;
  const csHovered = mouse.x >= csx && mouse.x <= csx + cstw && mouse.y >= csy && mouse.y <= csy + csth;
  ctx.fillStyle = csHovered ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.15)';
  if (csHovered) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 12; }
  ctx.fillRect(csx, csy, cstw, csth);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(csx, csy, cstw, csth);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(settings.leftHanded ? 'LEFT' : 'RIGHT', csx + cstw / 2, csy + csth / 2 + 1);

  drawToggleRow('Sound Effects', L.soundRowY, false, false);
  drawToggleRow('Music', L.musicRowY, false, false);
  drawToggleRow('Graphics Quality', L.graphicsRowY, false, false);

  // Back button
  const backHovered = mouse.x >= L.backX && mouse.x <= L.backX + L.backW &&
                       mouse.y >= L.backY && mouse.y <= L.backY + L.backH;
  ctx.fillStyle = backHovered ? '#00ff88' : '#00cc66';
  if (backHovered) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 15; }
  ctx.fillRect(L.backX, L.backY, L.backW, L.backH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(L.backX, L.backY, L.backW, L.backH);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BACK', L.backX + L.backW / 2, L.backY + L.backH / 2);

  ctx.fillStyle = '#666666';
  ctx.font = 'italic 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Sound, music, and graphics options coming soon', ctx.canvas.width / 2, L.panelY + L.panelH - 100);
}

/* =========================
   Mobile Startup Prompt
   (real phones/tablets only — IS_MOBILE is UA-based, so touchscreen
   laptops correctly never see this)
========================= */
export function getMobilePromptLayout(ctx) {
  const panelW = 440, panelH = 300;
  const panelX = ctx.canvas.width / 2 - panelW / 2;
  const panelY = ctx.canvas.height / 2 - panelH / 2;

  const rowH = 64;
  const rowX = panelX + 30;
  const rowW = panelW - 60;
  const firstRowY = panelY + 100;

  const toggleW = 90, toggleH = 36;

  const continueW = 200, continueH = 54;
  const continueX = ctx.canvas.width / 2 - continueW / 2;
  const continueY = panelY + panelH - 80;

  return {
    panelX, panelY, panelW, panelH,
    rotateRowY: firstRowY,
    fullscreenRowY: firstRowY + rowH,
    rowX, rowW,
    toggleX: rowX + rowW - toggleW, toggleW, toggleH,
    continueX, continueY, continueW, continueH
  };
}

export function drawMobilePrompt(ctx, mouse, prefs) {
  ctx.fillStyle = 'rgba(0, 8, 20, 0.92)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const L = getMobilePromptLayout(ctx);

  ctx.fillStyle = 'rgba(10, 20, 35, 0.95)';
  ctx.fillRect(L.panelX, L.panelY, L.panelW, L.panelH);
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(L.panelX, L.panelY, L.panelW, L.panelH);

  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DISPLAY OPTIONS', ctx.canvas.width / 2, L.panelY + 40);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '14px Arial';
  ctx.fillText('You can change these anytime in Settings', ctx.canvas.width / 2, L.panelY + 68);

  const drawToggleRow = (label, rowY, isOn) => {
    ctx.fillStyle = '#ffffff';
    ctx.font = '19px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, L.rowX, rowY);

    const tx = L.toggleX, ty = rowY - L.toggleH / 2, tw = L.toggleW, th = L.toggleH;
    const hovered = mouse.x >= tx && mouse.x <= tx + tw && mouse.y >= ty && mouse.y <= ty + th;

    ctx.fillStyle = isOn ? '#00cc66' : 'rgba(255,255,255,0.15)';
    if (hovered) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 12; }
    ctx.fillRect(tx, ty, tw, th);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, ty, tw, th);

    ctx.fillStyle = isOn ? '#000000' : '#ffffff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isOn ? 'ON' : 'OFF', tx + tw / 2, ty + th / 2 + 1);
  };

  drawToggleRow('Suggest Landscape', L.rotateRowY, prefs.wantRotateHint);
  drawToggleRow('Fullscreen', L.fullscreenRowY, prefs.wantFullscreen);

  // Continue button
  const hovered = mouse.x >= L.continueX && mouse.x <= L.continueX + L.continueW &&
                  mouse.y >= L.continueY && mouse.y <= L.continueY + L.continueH;
  ctx.fillStyle = hovered ? '#00ff88' : '#00cc66';
  if (hovered) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 15; }
  ctx.fillRect(L.continueX, L.continueY, L.continueW, L.continueH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(L.continueX, L.continueY, L.continueW, L.continueH);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CONTINUE', L.continueX + L.continueW / 2, L.continueY + L.continueH / 2);
}

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

export { drawFlashMessage };
