// World-space rendering: enemies, bosses, player, bullets, missiles, hit sparks
import {
  bgImage, bgLoaded, shipImage, shipLoaded, enemyShipImages, enemyShipImagesLoaded,
  enemyTypeToImage, bossImages, bossImagesLoaded,
  missileImage, missileImageLoaded, playerMissileImage, playerMissileImageLoaded
} from './assets.js';
import { player } from './player.js';
import { enemies, enemyBullets } from './enemies.js';
import { bosses, homingMissiles } from './bosses.js';
import { hitSparks } from './weapons.js';
import { drawBossBigBar } from './ui-hud.js';

export function drawGameEntities(ctx, cameraX) {
  // Draw enemies
  enemies.forEach(e => {
    const sx = Math.round(e.x - cameraX);
    const imageKey = enemyTypeToImage[e.type];
    
    if (imageKey && enemyShipImagesLoaded[imageKey]) {
      ctx.drawImage(enemyShipImages[imageKey], sx, Math.round(e.y), e.width, e.height);
      
      if (e.isKamikaze) {
        const pulseRate = e.kamikazeState === 'armed' ? (0.6 + (1 - Math.max(0, e.armTimer || 0) / 3000) * 1.8) : 0.3;
        const pulse = Math.sin(e.pulseTime * pulseRate) * 0.5 + 0.5;
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
        const pulseRate2 = e.kamikazeState === 'armed' ? (0.6 + (1 - Math.max(0, e.armTimer || 0) / 3000) * 1.8) : 0.3;
        const pulse = Math.sin(e.pulseTime * pulseRate2) * 0.5 + 0.5;
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

    if (e.isKamikaze && e.kamikazeState === 'armed') {
      const urgency = 1 - Math.max(0, (e.armTimer || 0) / 3000); // 0 -> 1 as it counts down
      const blastRadius = ((e.width + e.height) / 2) * 2;
      const ringPulse = Math.sin((e.pulseTime || 0) * (0.6 + urgency * 1.8)) * 0.5 + 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 80, 0, ${0.25 + ringPulse * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx + e.width / 2, Math.round(e.y) + e.height / 2, blastRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
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
  } else {
    if (shipLoaded) {
      ctx.drawImage(shipImage, psx, Math.round(player.y), player.width, player.height);
    } else {
      ctx.fillStyle = player.color;
      ctx.fillRect(psx, Math.round(player.y), player.width, player.height);
    }
  }
}

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
