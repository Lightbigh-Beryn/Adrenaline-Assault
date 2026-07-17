// Audio system stub — sound effects and ambient music.
// Drop files into /sounds and /music, then register them below.
// This mirrors the pattern already used in assets.js for images.

const sounds = {};   // e.g. { laser: new Audio('sounds/laser.mp3') }
const music = {};    // e.g. { ambient1: new Audio('music/ambient1.mp3') }

let sfxVolume = 0.7;
let musicVolume = 0.4;
let currentMusic = null;

/* =========================
   Registration
========================= */
// Call this once per sound effect you add, e.g.:
//   registerSound('laser', 'sounds/laser.mp3');
export function registerSound(id, path) {
  const audio = new Audio(path);
  audio.volume = sfxVolume;
  sounds[id] = audio;
}

// Call this once per music track, e.g.:
//   registerMusic('ambient1', 'music/ambient1.mp3');
export function registerMusic(id, path) {
  const audio = new Audio(path);
  audio.loop = true;
  audio.volume = musicVolume;
  music[id] = audio;
}

/* =========================
   Playback
========================= */
export function playSound(id) {
  const base = sounds[id];
  if (!base) {
    console.warn(`Sound not registered: ${id}`);
    return;
  }
  // Clone so overlapping plays (e.g. rapid-fire shots) don't cut each other off
  const instance = base.cloneNode();
  instance.volume = sfxVolume;
  instance.play().catch(() => {}); // ignore autoplay-block errors
}

export function playMusic(id) {
  if (currentMusic && currentMusic !== music[id]) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }
  const track = music[id];
  if (!track) {
    console.warn(`Music not registered: ${id}`);
    return;
  }
  currentMusic = track;
  track.play().catch(() => {});
}

export function stopMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
    currentMusic = null;
  }
}

/* =========================
   Volume Controls
========================= */
export function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v));
  Object.values(sounds).forEach(a => a.volume = sfxVolume);
}

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
  Object.values(music).forEach(a => a.volume = musicVolume);
}
