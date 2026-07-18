// Mobile DOM-overlay controls: a floating joystick and a semicircle hotbar,
// anchored to the real viewport corners (not canvas coordinates), so they stay
// reachable in portrait even though the canvas itself is a thin horizontal
// letterboxed strip in that orientation. Landscape/desktop are unaffected —
// this overlay only activates for real phones/tablets (IS_MOBILE) in portrait.
import { IS_MOBILE } from './config.js';
import { touchControls } from './input.js';
import { TIMED_POWERUPS, activatePowerupById } from './upgrades.js';
import { player } from './player.js';

const CONTAINER_SIZE = 170; // must match #hotbar-semicircle width/height in CSS
const GLOW_COLORS = {
  homingMissiles: '#00ffff',
  shieldBubble: '#ffff00',
  slowTime: '#ff00ff',
  ultraDamage: '#ff4400'
};

let leftHanded = true;
let overlayActive = false;
let gameplayActive = false;
let joystickZone, joystickKnob, hotbarContainer;
let hotbarSlots = []; // { el, id, badgeEl }
let getLeftHandedSetting = () => true;

export function isMobileOverlayActive() {
  return overlayActive;
}

export function setMobileControlsGameplayActive(isPlaying) {
  if (gameplayActive === isPlaying) return;
  gameplayActive = isPlaying;
  refreshMobileControlsLayout();
}

export function refreshMobileControlsLayout() {
  if (!joystickZone) return;
  leftHanded = getLeftHandedSetting();
  refreshLayout();
}

export function initMobileControls(getLeftHanded) {
  joystickZone = document.getElementById('joystick-zone');
  joystickKnob = document.getElementById('joystick-knob');
  hotbarContainer = document.getElementById('hotbar-semicircle');

  if (!joystickZone || !joystickKnob || !hotbarContainer) return;

  getLeftHandedSetting = getLeftHanded;
  buildHotbarSlots();
  wireJoystickTouch();

  window.addEventListener('resize', refreshMobileControlsLayout);
  window.addEventListener('orientationchange', () => setTimeout(refreshMobileControlsLayout, 300));
  refreshMobileControlsLayout();

  // Visual sync (charge counts, active glow) - cheap enough on an interval,
  // doesn't need to run every render frame.
  setInterval(syncHotbarVisuals, 150);
}

function refreshLayout() {
  const isPortrait = window.innerHeight > window.innerWidth;
  overlayActive = IS_MOBILE && isPortrait && gameplayActive;

  joystickZone.classList.toggle('visible', overlayActive);
  hotbarContainer.classList.toggle('visible', overlayActive);

  if (!overlayActive) return;

  // Joystick sits on the player's chosen handed side; hotbar takes the opposite corner.
  joystickZone.classList.toggle('side-left', leftHanded);
  joystickZone.classList.toggle('side-right', !leftHanded);
  hotbarContainer.classList.toggle('side-left', !leftHanded);
  hotbarContainer.classList.toggle('side-right', leftHanded);

  positionHotbarSlots();
}

function buildHotbarSlots() {
  hotbarContainer.innerHTML = '';
  hotbarSlots = [];

  Object.entries(TIMED_POWERUPS).forEach(([id, powerup]) => {
    const slot = document.createElement('div');
    slot.className = 'hotbar-slot';
    slot.textContent = powerup.icon;

    const badge = document.createElement('span');
    badge.className = 'count-badge';
    slot.appendChild(badge);

    slot.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      activatePowerupById(id);
    }, { passive: false });

    hotbarContainer.appendChild(slot);
    hotbarSlots.push({ el: slot, id, badgeEl: badge });
  });
}

function positionHotbarSlots() {
  const n = hotbarSlots.length;
  if (n === 0) return;

  const isLeftCorner = hotbarContainer.classList.contains('side-left');
  // Corner-anchored fan: the only usable open directions from a bottom corner
  // are "straight up" through "sideways, inward toward screen center" — a
  // quarter-circle sweep (not a full 180°, which wouldn't fit at a corner).
  const startAngle = -90; // straight up
  const endAngle = isLeftCorner ? 0 : -180; // inward toward center
  const radius = 68;
  const origin = isLeftCorner ? 0 : CONTAINER_SIZE;

  hotbarSlots.forEach(({ el }, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angleDeg = startAngle + (endAngle - startAngle) * t;
    const angleRad = angleDeg * Math.PI / 180;
    const x = Math.cos(angleRad) * radius;
    const y = Math.sin(angleRad) * radius;

    el.style.left = (origin + x) + 'px';
    el.style.top = (CONTAINER_SIZE + y) + 'px';
  });
}

function syncHotbarVisuals() {
  if (!overlayActive) return;

  hotbarSlots.forEach(({ el, id, badgeEl }) => {
    const count = player.powerups[id] || 0;
    const isActive = player[id + 'End'] && Date.now() < player[id + 'End'];

    el.classList.toggle('has-charges', count > 0);
    el.classList.toggle('active', !!isActive);
    badgeEl.textContent = count > 0 ? `x${count}` : '';

    if (isActive) {
      el.style.setProperty('--glow-color', GLOW_COLORS[id] || '#ffff00');
    }
  });
}

function wireJoystickTouch() {
  joystickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchControls.active = true;
    touchControls.identifier = touch.identifier;
    touchControls.startX = touch.clientX;
    touchControls.startY = touch.clientY;
    touchControls.currentX = touch.clientX;
    touchControls.currentY = touch.clientY;
  }, { passive: false });

  joystickZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === touchControls.identifier) {
        touchControls.currentX = touch.clientX;
        touchControls.currentY = touch.clientY;

        const dx = touch.clientX - touchControls.startX;
        const dy = touch.clientY - touchControls.startY;
        const dist = Math.min(Math.hypot(dx, dy), 40);
        const angle = Math.atan2(dy, dx);
        joystickKnob.style.transform =
          `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
        break;
      }
    }
  }, { passive: false });

  const endTouch = (e) => {
    const touches = e.changedTouches || [];
    for (const touch of touches) {
      if (touch.identifier === touchControls.identifier) {
        touchControls.active = false;
        touchControls.identifier = null;
        joystickKnob.style.transform = 'translate(0px, 0px)';
        break;
      }
    }
  };
  joystickZone.addEventListener('touchend', endTouch, { passive: false });
  joystickZone.addEventListener('touchcancel', endTouch, { passive: false });
}
