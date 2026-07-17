// Utility functions and helpers

/* =========================
   Time Formatting
========================= */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeDetailed(ms) {
  const hrs = Math.floor(ms / (1000*60*60));
  const mins = Math.floor((ms % (1000*60*60)) / (1000*60));
  const secs = Math.floor((ms % (1000*60)) / 1000);
  return `${hrs}h ${mins}m ${secs}s`;
}

/* =========================
   Math Helpers
========================= */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/* =========================
   Array Helpers
========================= */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/* =========================
   Object Helpers
========================= */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* =========================
   Local Storage Helpers
========================= */
export function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    return false;
  }
}

export function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return defaultValue;
  }
}

export function clearLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
    return false;
  }
}

/* =========================
   Camera Shake System
========================= */
export const cameraShake = {
  active: false,
  intensity: 0,
  duration: 0,
  startTime: 0,
  offsetX: 0,
  offsetY: 0
};

export function triggerCameraShake(intensity, duration) {
  cameraShake.active = true;
  cameraShake.intensity = intensity;
  cameraShake.duration = duration;
  cameraShake.startTime = Date.now();
}

export function updateCameraShake() {
  if (!cameraShake.active) {
    cameraShake.offsetX = 0;
    cameraShake.offsetY = 0;
    return;
  }
  
  const elapsed = Date.now() - cameraShake.startTime;
  if (elapsed >= cameraShake.duration) {
    cameraShake.active = false;
    cameraShake.offsetX = 0;
    cameraShake.offsetY = 0;
    return;
  }
  
  // Decay shake over time
  const progress = elapsed / cameraShake.duration;
  const currentIntensity = cameraShake.intensity * (1 - progress);
  
  // Random shake offset
  cameraShake.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
  cameraShake.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
}

/* =========================
   FPS Counter
========================= */
let fpsHistory = [];
let lastFpsTime = performance.now();

export function updateFPS() {
  const now = performance.now();
  const delta = now - lastFpsTime;
  lastFpsTime = now;
  
  if (delta > 0) {
    fpsHistory.push(1000 / delta);
    if (fpsHistory.length > 60) fpsHistory.shift();
  }
}

export function getFPS() {
  if (fpsHistory.length === 0) return 0;
  const sum = fpsHistory.reduce((a, b) => a + b, 0);
  return Math.round(sum / fpsHistory.length);
}

/* =========================
   Debug Helpers
========================= */
export function drawDebugInfo(ctx, data) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10, 10, 200, Object.keys(data).length * 20 + 10);
  
  ctx.fillStyle = '#00ff00';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  
  let y = 25;
  Object.entries(data).forEach(([key, value]) => {
    ctx.fillText(`${key}: ${value}`, 15, y);
    y += 20;
  });
  
  ctx.restore();
}

/* =========================
   Performance Timing
========================= */
const timers = {};

export function startTimer(name) {
  timers[name] = performance.now();
}

export function endTimer(name) {
  if (!timers[name]) return 0;
  const elapsed = performance.now() - timers[name];
  delete timers[name];
  return elapsed;
}

export function logTimer(name) {
  const elapsed = endTimer(name);
  console.log(`⏱️ ${name}: ${elapsed.toFixed(2)}ms`);
  return elapsed;
}