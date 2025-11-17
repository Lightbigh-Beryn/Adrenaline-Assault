/* =========================
Title screen background
========================= */
export const titleBg = new Image();
titleBg.src = 'assets/images/TitleScreen.png';
export let titleBgLoaded = false;
titleBg.onload = () => { titleBgLoaded = true; };
/* =========================
Game background
========================= */
export const bgImage = new Image();
bgImage.src = 'assets/images/Background.png';
export let bgLoaded = false;
bgImage.onload = () => { bgLoaded = true; };
/* =========================
Player ship
========================= */
export const shipImage = new Image();
shipImage.src = 'assets/images/ship.png';
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
enemyShipImages.scout.src = 'assets/images/EnemyShip3.png';
enemyShipImages.destroyer.src = 'assets/images/EnemyShip2.png';
enemyShipImages.fighter.src = 'assets/images/purpleship1.png';
enemyShipImages.bomber.src = 'assets/images/dreadnaught.png';
enemyShipImages.kamikaze.src = 'assets/images/drone2.png';
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
bossImages.mini.src = 'assets/images/dreadnaught.png';
bossImages.final.src = 'assets/images/boss.png';
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
missileImage.src = 'assets/images/missile.png';
export let missileImageLoaded = false;
missileImage.onload = () => { missileImageLoaded = true; };
export const playerMissileImage = new Image();
playerMissileImage.src = 'assets/images/player_missile.png';
export let playerMissileImageLoaded = false;
playerMissileImage.onload = () => { playerMissileImageLoaded = true; };
