import type { LevelData } from '../types';
import * as C from '../constants';

export function generateLevel(difficulty: number): LevelData {
  const platforms = [];
  const destructibleCrates = [];
  const enemies = [];
  const cages = [];
  const spikePits = [];

  const groundY = C.GAME_HEIGHT - 50;
  const levelLength = C.GAME_WIDTH * (2 + difficulty); // Longer levels for higher difficulty

  // Create a floor platform
  platforms.push({ x: 0, y: groundY, width: levelLength, height: 20 });

  let lastPlatformX = 0;

  // Generate platforms
  for (let i = 0; i < 10 + difficulty * 5; i++) {
    const x = lastPlatformX + 150 + Math.random() * 200;
    const y = groundY - 50 - Math.random() * 200;
    const width = 100 + Math.random() * 100;
    platforms.push({ x, y, width, height: 20 });
    lastPlatformX = x + width;
  }

  // Generate crates
  for (let i = 0; i < 5 + difficulty * 2; i++) {
    const platformIndex = Math.floor(Math.random() * (platforms.length -1));
    const platform = platforms[platformIndex];
    if (platform) {
        const x = platform.x + Math.random() * platform.width;
        const y = platform.y - C.CRATE_HEIGHT;
        destructibleCrates.push({ x, y, width: C.CRATE_WIDTH, height: C.CRATE_HEIGHT });
    }
  }

  // Generate enemies
  for (let i = 0; i < 3 + difficulty * 2; i++) {
    const platformIndex = Math.floor(Math.random() * (platforms.length -1));
    const platform = platforms[platformIndex];
    if (platform) {
        const x = platform.x + Math.random() * platform.width;
        const y = platform.y - C.ENEMY_HEIGHT;
        const behavior = Math.random() > 0.5 ? 'shoot' : 'charge';
        enemies.push({
            x,
            y,
            width: C.ENEMY_WIDTH,
            height: C.ENEMY_HEIGHT,
            direction: 'left',
            moveSpeed: 1 + difficulty * 0.2,
            shootCooldown: 180 - difficulty * 10,
            isBoss: false,
            behavior,
        });
    }
  }

  // Generate cages
  const platformIndex = Math.floor(Math.random() * (platforms.length -1));
  const platform = platforms[platformIndex];
  if (platform) {
    cages.push({
        x: platform.x + platform.width / 2,
        y: platform.y - C.CRATE_HEIGHT,
        width: C.CRATE_WIDTH,
        height: C.CRATE_HEIGHT,
    });
  }


  return {
    platforms,
    destructibleCrates,
    enemies,
    cages,
    spikePits,
  };
}
