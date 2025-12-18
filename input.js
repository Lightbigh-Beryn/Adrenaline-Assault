// Input handling - keyboard, mouse, and touch controls
import { IS_MOBILE } from './config.js';

/* =========================
   Input State
========================= */
export const keys = {};
export const mouse = { x: 0, y: 0, down: false };
export const touchControls = {
  active: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  identifier: null
};

/* =========================
   User Interaction Tracking
========================= */
export let userHasInteracted = false;

/* =========================
   Setup Input Handlers
========================= */
export function setupInputHandlers(canvas, callbacks) {

  /* ===== Keyboard ===== */
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (callbacks.onKeyDown) {
      callbacks.onKeyDown(e);
    }

    if (e.code === 'Space' || e.code.startsWith('Arrow')) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;

    if (callbacks.onKeyUp) {
      callbacks.onKeyUp(e);
    }
  });

  /* ===== Mouse ===== */
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
  });

  canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;

    if (!userHasInteracted) {
      userHasInteracted = true;
    }

    if (callbacks.onMouseDown) {
      callbacks.onMouseDown(e, mouse);
    }
  });

  canvas.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  /* =========================
     TOUCH CONTROLS (REWORKED)
     - Movement from LEFT touch zone
     - UI taps still hit canvas
  ========================= */

  const touchZone = document.getElementById('touch-zone') || window;

  // Touch start (movement)
  touchZone.addEventListener('touchstart', (e) => {
    e.preventDefault();

    if (!userHasInteracted) {
      userHasInteracted = true;
    }

    const touch = e.changedTouches[0];

    touchControls.active = true;
    touchControls.identifier = touch.identifier;
    touchControls.startX = touch.clientX;
    touchControls.startY = touch.clientY;
    touchControls.currentX = touch.clientX;
    touchControls.currentY = touch.clientY;
  }, { passive: false });

  // Touch move (movement)
  touchZone.addEventListener('touchmove', (e) => {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchControls.identifier) {
        touchControls.currentX = touch.clientX;
        touchControls.currentY = touch.clientY;
        break;
      }
    }
  }, { passive: false });

  // Touch end (movement)
  touchZone.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchControls.identifier) {
        touchControls.active = false;
        touchControls.identifier = null;
        break;
      }
    }
  }, { passive: false });

  touchZone.addEventListener('touchcancel', () => {
    touchControls.active = false;
    touchControls.identifier = null;
  }, { passive: false });

  /* ===== Canvas UI Touches ===== */
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touch = e.changedTouches[0];
    mouse.x = (touch.clientX - rect.left) * scaleX;
    mouse.y = (touch.clientY - rect.top) * scaleY;

    if (callbacks.onMouseDown) {
      callbacks.onMouseDown(e, mouse);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touch = e.touches[0];
    if (!touch) return;

    mouse.x = (touch.clientX - rect.left) * scaleX;
    mouse.y = (touch.clientY - rect.top) * scaleY;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    mouse.down = false;
  }, { passive: false });

  /* ===== Window Focus ===== */
  window.addEventListener('blur', () => {
    if (callbacks.onWindowBlur) {
      callbacks.onWindowBlur();
    }
  });

  window.addEventListener('focus', () => {
    if (callbacks.onWindowFocus) {
      callbacks.onWindowFocus();
    }
  });

  /* ===== Click-to-start ===== */
  window.addEventListener('click', () => {
    if (!userHasInteracted) {
      userHasInteracted = true;
    }
  }, { once: true });
}

/* =========================
   Input Query Functions
========================= */
export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function getMousePosition() {
  return { x: mouse.x, y: mouse.y };
}

export function getTouchMovement() {
  if (!touchControls.active) {
    return { x: 0, y: 0 };
  }

  const dx = touchControls.currentX - touchControls.startX;
  const dy = touchControls.currentY - touchControls.startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) return { x: 0, y: 0 };

  const speed = Math.min(distance / 30, 1);

  return {
    x: (dx / distance) * speed,
    y: (dy / distance) * speed
  };
}

/* =========================
   Reset Input State
========================= */
export function resetInputState() {
  Object.keys(keys).forEach(key => keys[key] = false);
  mouse.down = false;
  touchControls.active = false;
  touchControls.identifier = null;
}
