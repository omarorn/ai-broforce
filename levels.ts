import type { LevelData } from './types';
import * as C from './constants';

const groundY = C.GAME_HEIGHT - 50;
const w = C.GAME_WIDTH;

export const levels: LevelData[] = [
  // Level 1: Basic Introduction
  {
    platforms: [
      { x: 150, y: groundY - 100, width: 200, height: 20 },
      { x: 500, y: groundY - 100, width: 200, height: 20 },
      { x: 750, y: groundY - 200, width: 150, height: 20 },
    ],
    destructibleCrates: [
      { x: 200, y: groundY - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 550, y: groundY - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
    ],
    enemies: [
      { x: 250, y: groundY - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1, shootCooldown: 180, isBoss: false, behavior: 'shoot' },
      { x: 600, y: groundY - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.2, shootCooldown: 150, isBoss: false, behavior: 'shoot' },
      { x: 800, y: groundY - 200 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1, shootCooldown: 160, isBoss: false, behavior: 'fly' },
    ],
    cages: [
        { x: w-100, y: groundY - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT }
    ],
    spikePits: [
      { x: 350, y: groundY, width: 100, height: 50 },
    ],
  },
  // Level 2: More Platforming & Enemies
  {
    platforms: [
        { x: 100, y: groundY - 80, width: 150, height: 20 },
        { x: 350, y: groundY - 160, width: 150, height: 20 },
        { x: 600, y: groundY - 240, width: 150, height: 20 },
        { x: w - 250, y: groundY - 120, width: 150, height: 20 },
    ],
    destructibleCrates: [
      { x: 150, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 400, y: groundY - 160 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: w - 200, y: groundY - 120 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: w - 250, y: groundY - 120 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
    ],
    enemies: [
      { x: 120, y: groundY - 80 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.5, shootCooldown: 120, isBoss: false, behavior: 'fly' },
      { x: 400, y: groundY - 160 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.5, shootCooldown: 100, isBoss: false, behavior: 'fly' },
      { x: 650, y: groundY - 240 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'right', moveSpeed: 2, shootCooldown: 90, isBoss: false, behavior: 'charge' },
      { x: w - 100, y: groundY - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1, shootCooldown: 150, isBoss: false, behavior: 'shoot' },
      { x: 50, y: groundY - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'right', moveSpeed: 1, shootCooldown: 150, isBoss: false, behavior: 'shoot' },
    ],
    cages: [
        { x: 650, y: groundY - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT }
    ],
  },
   // Level 3: Boss Fight
   {
    platforms: [
        { x: 0, y: groundY - 150, width: 200, height: 20 },
        { x: w - 200, y: groundY - 150, width: 200, height: 20 },
        { x: w/2 - 100, y: groundY - 250, width: 200, height: 20 },
    ],
    destructibleCrates: [
        { x: 50, y: groundY-C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
        { x: 100, y: groundY-C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
        { x: w-100, y: groundY-C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
        { x: w-150, y: groundY-C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
    ],
    enemies: [],
    cages: [
        { x: w/2 - C.CRATE_WIDTH/2, y: groundY - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT }
    ],
    boss: {
        x: w / 2 - C.BOSS_WIDTH / 2,
        y: groundY - C.BOSS_HEIGHT,
        width: C.BOSS_WIDTH,
        height: C.BOSS_HEIGHT,
        direction: 'left',
        moveSpeed: 2.5,
        shootCooldown: 80,
        isBoss: true
    }
   },
  // Level 4: Vertical Challenge
  {
    platforms: [
      { x: 100, y: groundY - 100, width: 150, height: 20 },
      { x: w - 250, y: groundY - 200, width: 150, height: 20 },
      { x: 100, y: groundY - 300, width: 150, height: 20 },
      { x: w - 250, y: groundY - 400, width: 150, height: 20 },
    ],
    destructibleCrates: [
      { x: 150, y: groundY - 300 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: w - 200, y: groundY - 400 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
    ],
    enemies: [
      { x: 150, y: groundY - 100 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1, shootCooldown: 180, isBoss: false, behavior: 'fly' },
      { x: w - 200, y: groundY - 200 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1, shootCooldown: 180, isBoss: false, behavior: 'fly' },
      { x: 150, y: groundY - 400 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 2, shootCooldown: 120, isBoss: false, behavior: 'charge' },
    ],
    cages: [
        { x: w - 250, y: groundY - 500, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT }
    ],
    spikePits: [
      { x: 0, y: groundY, width: 100, height: 50 },
      { x: w - 100, y: groundY, width: 100, height: 50 },
    ],
  },
  // Level 5: Gauntlet
  {
    platforms: [
      { x: 0, y: groundY - 80, width: w, height: 20 },
    ],
    destructibleCrates: [
      { x: 100, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 200, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 300, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 400, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 500, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 600, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 700, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
      { x: 800, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT },
    ],
    enemies: [
      { x: 150, y: groundY - 80 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.5, shootCooldown: 120, isBoss: false, behavior: 'shoot' },
      { x: 250, y: groundY - 80 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.5, shootCooldown: 120, isBoss: false, behavior: 'shoot' },
      { x: 350, y: groundY - 80 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.5, shootCooldown: 120, isBoss: false, behavior: 'charge' },
      { x: 450, y: groundY - 80 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.5, shootCooldown: 120, isBoss: false, behavior: 'charge' },
      { x: 550, y: groundY - 80 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.5, shootCooldown: 120, isBoss: false, behavior: 'fly' },
      { x: 650, y: groundY - 80 - C.ENEMY_HEIGHT, width: C.ENEMY_WIDTH, height: C.ENEMY_HEIGHT, direction: 'left', moveSpeed: 1.5, shootCooldown: 120, isBoss: false, behavior: 'fly' },
    ],
    cages: [
        { x: w - 100, y: groundY - 80 - C.CRATE_HEIGHT, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT }
    ],
  }
];
