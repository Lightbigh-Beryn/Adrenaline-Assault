/* =========================
Title screen background
========================= */
export const titleBg = new Image();
titleBg.src = './assets/images/TitleScreen.png';
export let titleBgLoaded = false;
titleBg.onload = () => { titleBgLoaded = true; };
/* =========================
Game background
========================= */
export const bgImage = new Image();
bgImage.src = './assets/images/Background.png';
export let bgLoaded = false;
bgImage.onload = () => { bgLoaded = true; };
/* =========================
Player ship
========================= */
export const shipImage = new Image();
shipImage.src = './assets/images/ship.png';
export let shipLoaded = false;
shipImage.onload = () => { shipLoaded = true; };
/* =========================
Enemy Ships
========================= */
export const enemyShipImages = {
scout: new Image(),
destroyer: new Image(),
fighter: new Image(),
bomber: new Image(),
kamikaze: new Image()
};
enemyShipImages.scout.src = './assets/images/EnemyShip3.png';
enemyShipImages.destroyer.src = './assets/images/EnemyShip2.png';
enemyShipImages.fighter.src = './assets/images/purpleship1.png';
enemyShipImages.bomber.src = './assets/images/dreadnaught.png';
enemyShipImages.kamikaze.src = './assets/images/drone2.png';
export let enemyShipImagesLoaded = {
scout: false,
destroyer: false,
fighter: false,
bomber: false,
kamikaze: false
};
enemyShipImages.scout.onload = () => { enemyShipImagesLoaded.scout = true; };
enemyShipImages.destroyer.onload = () => { enemyShipImagesLoaded.destroyer = true; };
enemyShipImages.fighter.onload = () => { enemyShipImagesLoaded.fighter = true; };
enemyShipImages.bomber.onload = () => { enemyShipImagesLoaded.bomber = true; };
enemyShipImages.kamikaze.onload = () => { enemyShipImagesLoaded.kamikaze = true; };
// Map enemy TYPES to which IMAGE they use
export const enemyTypeToImage = {
basic: 'scout',
tank: 'destroyer',
interceptor: 'fighter',
elite: 'fighter',
bomber: 'bomber',
kamikaze: 'kamikaze'
};
/* =========================
Boss Ships
========================= */
export const bossImages = {
mini: new Image(),
final: new Image()
};
bossImages.mini.src = './assets/images/dreadnaught.png';
bossImages.final.src = './assets/images/boss.png';
export let bossImagesLoaded = {
mini: false,
final: false
};
bossImages.mini.onload = () => { bossImagesLoaded.mini = true; };
bossImages.final.onload = () => { bossImagesLoaded.final = true; };
/* =========================
Missile images
========================= */
export const missileImage = new Image();
missileImage.src = './assets/images/missile.png';
export let missileImageLoaded = false;
missileImage.onload = () => { missileImageLoaded = true; };
export const playerMissileImage = new Image();
playerMissileImage.src = './assets/images/player_missile.png';
export let playerMissileImageLoaded = false;
playerMissileImage.onload = () => { playerMissileImageLoaded = true; };

/* =========================
   Asset Loading Check
========================= */
export function areAllAssetsLoaded() {
  return (
    titleBgLoaded &&
    bgLoaded &&
    shipLoaded &&
    enemyShipImagesLoaded.scout &&
    enemyShipImagesLoaded.destroyer &&
    enemyShipImagesLoaded.fighter &&
    enemyShipImagesLoaded.bomber &&
    enemyShipImagesLoaded.kamikaze &&
    bossImagesLoaded.mini &&
    bossImagesLoaded.final &&
    missileImageLoaded &&
    playerMissileImageLoaded
  );
}

export function getLoadingProgress() {
  const total = 12; // Total number of images
  let loaded = 0;
  
  if (titleBgLoaded) loaded++;
  if (bgLoaded) loaded++;
  if (shipLoaded) loaded++;
  if (enemyShipImagesLoaded.scout) loaded++;
  if (enemyShipImagesLoaded.destroyer) loaded++;
  if (enemyShipImagesLoaded.fighter) loaded++;
  if (enemyShipImagesLoaded.bomber) loaded++;
  if (enemyShipImagesLoaded.kamikaze) loaded++;
  if (bossImagesLoaded.mini) loaded++;
  if (bossImagesLoaded.final) loaded++;
  if (missileImageLoaded) loaded++;
  if (playerMissileImageLoaded) loaded++;
  
  return Math.floor((loaded / total) * 100);
}
/* =========================
   Wait for All Assets
========================= */
export async function waitForAssets() {
  const promises = [];
  
  // Title background
  if (!titleBgLoaded) {
    promises.push(new Promise(resolve => {
      if (titleBg.complete) {
        titleBgLoaded = true;
        resolve();
      } else {
        titleBg.addEventListener('load', () => {
          titleBgLoaded = true;
          resolve();
        });
        titleBg.addEventListener('error', () => {
          console.warn('⚠️ Failed to load title background');
          resolve(); // Resolve anyway so game doesn't hang
        });
      }
    }));
  }
  
  // Game background
  if (!bgLoaded) {
    promises.push(new Promise(resolve => {
      if (bgImage.complete) {
        bgLoaded = true;
        resolve();
      } else {
        bgImage.addEventListener('load', () => {
          bgLoaded = true;
          resolve();
        });
        bgImage.addEventListener('error', () => {
          console.warn('⚠️ Failed to load game background');
          resolve();
        });
      }
    }));
  }
  
  // Player ship
  if (!shipLoaded) {
    promises.push(new Promise(resolve => {
      if (shipImage.complete) {
        shipLoaded = true;
        resolve();
      } else {
        shipImage.addEventListener('load', () => {
          shipLoaded = true;
          resolve();
        });
        shipImage.addEventListener('error', () => {
          console.warn('⚠️ Failed to load player ship');
          resolve();
        });
      }
    }));
  }
  
  // Enemy ships
  Object.keys(enemyShipImages).forEach(key => {
    if (!enemyShipImagesLoaded[key]) {
      promises.push(new Promise(resolve => {
        const img = enemyShipImages[key];
        if (img.complete) {
          enemyShipImagesLoaded[key] = true;
          resolve();
        } else {
          img.addEventListener('load', () => {
            enemyShipImagesLoaded[key] = true;
            resolve();
          });
          img.addEventListener('error', () => {
            console.warn(`⚠️ Failed to load enemy ship: ${key}`);
            resolve();
          });
        }
      }));
    }
  });
  
  // Boss images
  Object.keys(bossImages).forEach(key => {
    if (!bossImagesLoaded[key]) {
      promises.push(new Promise(resolve => {
        const img = bossImages[key];
        if (img.complete) {
          bossImagesLoaded[key] = true;
          resolve();
        } else {
          img.addEventListener('load', () => {
            bossImagesLoaded[key] = true;
            resolve();
          });
          img.addEventListener('error', () => {
            console.warn(`⚠️ Failed to load boss image: ${key}`);
            resolve();
          });
        }
      }));
    }
  });
  
  // Missile images
  if (!missileImageLoaded) {
    promises.push(new Promise(resolve => {
      if (missileImage.complete) {
        missileImageLoaded = true;
        resolve();
      } else {
        missileImage.addEventListener('load', () => {
          missileImageLoaded = true;
          resolve();
        });
        missileImage.addEventListener('error', () => {
          console.warn('⚠️ Failed to load enemy missile');
          resolve();
        });
      }
    }));
  }
  
  if (!playerMissileImageLoaded) {
    promises.push(new Promise(resolve => {
      if (playerMissileImage.complete) {
        playerMissileImageLoaded = true;
        resolve();
      } else {
        playerMissileImage.addEventListener('load', () => {
          playerMissileImageLoaded = true;
          resolve();
        });
        playerMissileImage.addEventListener('error', () => {
          console.warn('⚠️ Failed to load player missile');
          resolve();
        });
      }
    }));
  }
  
  await Promise.all(promises);
  console.log('✅ All assets loaded successfully!');
}