import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GeneratedCharacters, Player, Enemy, Bullet, Crate, Explosion, GameEntityType, CharacterProfile, RescueCage, Turret, SpikePit } from '../types';
import { useGameLoop } from '../hooks/useGameLoop';
import { generateLevel } from '../services/levelGenerator';
import { audioService } from '../services/audioService';
import * as C from '../constants';
import Button from './ui/Button';
import { IoPause, IoPlay, IoVolumeHighOutline, IoVolumeMuteOutline, IoHomeOutline } from 'react-icons/io5';

// --- DEVELOPMENT ---
const DEV_MODE_GOD_MODE = true; // Player cannot die
// ---

interface GameScreenProps {
  characters: GeneratedCharacters;
  startingHero: CharacterProfile;
  onGameOver: (score: number) => void;
  onExit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ characters, startingHero, onGameOver, onExit }) => {
  const nextObjectId = useRef(Date.now());
  
  function createPlayer(hero: CharacterProfile, lives: number): Player {
      return {
          id: nextObjectId.current++,
          type: 'player',
          x: C.GAME_WIDTH / 2 - C.PLAYER_WIDTH / 2,
          y: C.GAME_HEIGHT - C.PLAYER_HEIGHT - 100,
          width: C.PLAYER_WIDTH,
          height: C.PLAYER_HEIGHT,
          hero,
          health: C.PLAYER_MAX_HEALTH,
          maxHealth: C.PLAYER_MAX_HEALTH,
          direction: 'right',
          lives,
          specialAbilityCooldown: 0,
          isInvincible: false,
          invincibilityTimer: 0,
          damageFlash: 0,
          // Movement
          hasDoubleJumped: false,
          isWallSliding: false,
          dashTimer: 0,
          isFlying: false,
          isGliding: false,
          isDigging: false,
          grapple: null,
      }
  };
  
  const [player, setPlayer] = useState<Player>(() => createPlayer(startingHero, C.PLAYER_STARTING_LIVES));
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [cages, setCages] = useState<RescueCage[]>([]);
  const [crates, setCrates] = useState<Crate[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [turrets, setTurrets] = useState<Turret[]>([]);
  const [spikePits, setSpikePits] = useState<SpikePit[]>([]);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [bulletCooldown, setBulletCooldown] = useState(0);
  const [yVelocity, setYVelocity] = useState(0);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0, magnitude: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const coyoteTimeCounter = useRef(0);
  const jumpBufferCounter = useRef(0);
  const levelStartTime = useRef(0);
  const prevEnemiesCount = useRef(0);
  
  const createEnemy = useCallback((base: Omit<Enemy, 'id' | 'type' | 'villain' | 'health' | 'maxHealth' | 'damageFlash'>, villain: CharacterProfile): Enemy => {
    const health = base.isBoss ? C.BOSS_MAX_HEALTH : C.ENEMY_MAX_HEALTH;
    return {
      id: nextObjectId.current++, type: 'enemy', ...base, villain, health, maxHealth: health, damageFlash: 0,
      behavior: base.behavior || 'shoot'
    };
  }, []);

  const createCrate = (x:number, y:number, width:number, height:number): Crate => ({
      id: nextObjectId.current++, type: 'crate', x, y, width, height, health: 20
  });
  
  const createCage = (x:number, y:number, width:number, height:number): RescueCage => ({
      id: nextObjectId.current++, type: 'rescue_cage', x, y, width, height, health: C.CAGE_HEALTH
  });

  const createSpikePit = (x:number, y:number, width:number, height:number): SpikePit => ({
      id: nextObjectId.current++, type: 'spike_pit', x, y, width, height
  });

  const createExplosion = (x: number, y: number, width: number, height: number): Explosion => ({
    id: nextObjectId.current++, type: 'explosion', x, y, width, height, life: 15
  });

  const triggerScreenShake = (magnitude: number, duration: number) => {
    setScreenShake({ x: 0, y: 0, magnitude });
    setTimeout(() => setScreenShake({ x: 0, y: 0, magnitude: 0 }), duration);
  };

  const checkCollision = (a: GameEntityType, b: GameEntityType) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  };
  
  const spawnLevel = useCallback((diff: number) => {
    const levelData = generateLevel(diff);
    
    levelStartTime.current = Date.now();

    setBullets([]);
    setTurrets([]);
    
    const staticPlatforms = levelData.platforms.map(p => createCrate(p.x, p.y, p.width, p.height));
    const destructible = levelData.destructibleCrates.map(p => createCrate(p.x, p.y, p.width, p.height));
    setCrates([...staticPlatforms, ...destructible]);

    setCages(levelData.cages.map(c => createCage(c.x, c.y, c.width, c.height)));
    
    if (levelData.spikePits) {
        setSpikePits(levelData.spikePits.map(s => createSpikePit(s.x, s.y, s.width, s.height)));
    } else {
        setSpikePits([]);
    }

    const newEnemies = levelData.enemies.map(e => createEnemy(e, characters.villains[Math.floor(Math.random() * characters.villains.length)]));
    if (levelData.boss) {
        newEnemies.push(createEnemy(levelData.boss, characters.villains[0]));
    }
    setEnemies(newEnemies);
  }, [createEnemy, characters.villains]);

  useEffect(() => {
    spawnLevel(difficulty);
  }, [difficulty, spawnLevel]);

  const swapHero = useCallback(() => {
    const availableHeroes = characters.heroes.filter(h => h.id !== player.hero.id);
    const nextHero = availableHeroes.length > 0 ? availableHeroes[Math.floor(Math.random() * availableHeroes.length)] : characters.heroes[0];
    
    setPlayer(p => ({
        ...p,
        hero: nextHero,
        health: p.maxHealth, // Full heal on swap
        specialAbilityCooldown: 0,
        isInvincible: true, // brief invincibility on swap
        invincibilityTimer: 120,
    }));
  }, [characters.heroes, player.hero.id]);

  const gameLoop = useCallback(() => {
    if (isPaused) return;

    // --- TIMERS & COOLDOWNS ---
    coyoteTimeCounter.current = Math.max(0, coyoteTimeCounter.current - 1);
    jumpBufferCounter.current = Math.max(0, jumpBufferCounter.current - 1);
    setBulletCooldown(c => Math.max(0, c - 1));
    setPlayer(p => ({
        ...p,
        specialAbilityCooldown: Math.max(0, p.specialAbilityCooldown - 1),
        invincibilityTimer: Math.max(0, p.invincibilityTimer - 1),
        isInvincible: p.invincibilityTimer > 0,
        damageFlash: Math.max(0, p.damageFlash - 1),
        dashTimer: Math.max(0, p.dashTimer - 1),
    }));
    setEnemies(es => es.map(e => ({...e, damageFlash: Math.max(0, e.damageFlash - 1) })));

    if(screenShake.magnitude > 0) {
        setScreenShake(s => ({...s, x: (Math.random() - 0.5) * s.magnitude, y: (Math.random() - 0.5) * s.magnitude }));
    }

    // --- PLAYER MOVEMENT & PHYSICS ---
    let newX = player.x;
    let newYVelocity = yVelocity;

    // Handle Dash
    if (player.dashTimer > 0) {
        newX += player.direction === 'right' ? C.PLAYER_SPEED * 2.5 : -C.PLAYER_SPEED * 2.5;
        newYVelocity = 0; // Dash is horizontal
    } else {
        if (keysPressed.current['a'] || keysPressed.current['ArrowLeft']) { newX -= C.PLAYER_SPEED; setPlayer(p => ({...p, direction: 'left'})) }
        if (keysPressed.current['d'] || keysPressed.current['ArrowRight']) { newX += C.PLAYER_SPEED; setPlayer(p => ({...p, direction: 'right'})) }
    }
    
    const allPlatforms = [...crates, {id: -1, type: 'crate' as const, x: 0, y: C.GAME_HEIGHT - 50, width: C.GAME_WIDTH, height: 50, health: 999}];
    
    let onGround = false;
    for (const platform of allPlatforms) {
      if (player.x + player.width > platform.x && player.x < platform.x + platform.width) {
        if (player.y + player.height <= platform.y && player.y + player.height + newYVelocity >= platform.y) {
          onGround = true;
          break;
        }
      }
    }

    if (player.hero.movementAbility.toLowerCase().includes('dig') && (keysPressed.current['s'] || keysPressed.current['arrowdown']) && onGround) {
        setPlayer(p => ({...p, isDigging: true}));
    } else {
        setPlayer(p => ({...p, isDigging: false}));
    }

    // Horizontal collision
    let horizontalCollision = false;
    for(const platform of crates) {
        if(checkCollision({...player, x:newX}, platform)) {
            if (player.isDigging) { // Allow digging through destructible crates
                platform.health = 0; // Destroy the crate
            } else {
                newX = player.x;
                horizontalCollision = true;
                break;
            }
        }
    }
    setPlayer(p => ({...p, x: Math.max(0, Math.min(C.GAME_WIDTH - C.PLAYER_WIDTH, newX))}));

    // Vertical physics
    newYVelocity += C.GRAVITY;
    let newPlayerY = player.y + newYVelocity;
    
    onGround = false;
    for (const platform of allPlatforms) {
      if (player.x + player.width > platform.x && player.x < platform.x + platform.width) {
        if (player.y + player.height <= platform.y && newPlayerY + player.height >= platform.y) {
          newPlayerY = platform.y - player.height;
          newYVelocity = 0;
          onGround = true;
          setPlayer(p => ({...p, hasDoubleJumped: false, isWallSliding: false, isFlying: false, isGliding: false, grapple: null }));
          break;
        }
      }
    }
    
    // Wall Slide
    let isWallSliding = false;
    if (horizontalCollision && !onGround && yVelocity > 0) {
        isWallSliding = true;
        newYVelocity = Math.min(newYVelocity, 2); // Wall friction
    }
    setPlayer(p => ({...p, isWallSliding}));
    
    if (onGround) coyoteTimeCounter.current = 5;

    // Jumping Logic & Advanced Movement
    let didJump = false;
    const movementAbility = player.hero.movementAbility.toLowerCase();

    // Flight
    if (movementAbility.includes('fly') && (keysPressed.current['w'] || keysPressed.current['arrowup'])) {
        newYVelocity = -C.PLAYER_JUMP_FORCE * 0.6;
        setPlayer(p => ({...p, isFlying: true}));
    } else {
        setPlayer(p => ({...p, isFlying: false}));
    }

    // Glide
    if (movementAbility.includes('glide') && (keysPressed.current['w'] || keysPressed.current['arrowup']) && newYVelocity > 0) {
        newYVelocity *= 0.8; // Reduce fall speed
        setPlayer(p => ({...p, isGliding: true}));
    } else {
        setPlayer(p => ({...p, isGliding: false}));
    }

    if (jumpBufferCounter.current > 0) {
        if (coyoteTimeCounter.current > 0) { // Ground jump
            newYVelocity = -C.PLAYER_JUMP_FORCE;
            didJump = true;
        } else if (isWallSliding) { // Wall jump
            const wallJumpDirection = player.direction === 'right' ? -1 : 1;
            setPlayer(p => ({...p, x: p.x + wallJumpDirection * C.PLAYER_SPEED, direction: wallJumpDirection === 1 ? 'right' : 'left' }));
            newYVelocity = -C.PLAYER_JUMP_FORCE * 1.1;
            didJump = true;
        } else if (movementAbility.includes('double') && !player.hasDoubleJumped) { // Double jump
            newYVelocity = -C.PLAYER_JUMP_FORCE;
            setPlayer(p => ({...p, hasDoubleJumped: true}));
            didJump = true;
            audioService.playSound('double_jump');
        }
    }
    
    if (didJump) {
        if (!movementAbility.includes('double')) audioService.playSound('jump');
        jumpBufferCounter.current = 0;
        coyoteTimeCounter.current = 0;
        setPlayer(p => ({...p, isWallSliding: false}));
    }

    if (isWallSliding) {
        audioService.playSound('wall_slide');
    }

    if (player.isDigging) {
        audioService.playSound('dig');
    }

    setPlayer(p => ({...p, y: newPlayerY}));
    setYVelocity(newYVelocity);
    
    // --- SHOOTING (PLAYER) ---
    if (keysPressed.current[' '] && bulletCooldown === 0) {
      const weapon = player.hero.weaponType.toLowerCase();
      const newBullets: Bullet[] = [];
      const commonProps = {
        type: 'bullet' as const, owner: 'player' as const, weaponType: player.hero.weaponType,
        y: player.y + player.height / 2 - C.BULLET_HEIGHT / 2, width: C.BULLET_WIDTH, height: C.BULLET_HEIGHT,
      };

      if (weapon.includes('shotgun')) {
        audioService.playSound('shoot_shotgun');
        for (let i = 0; i < 5; i++) newBullets.push({ ...commonProps, id: nextObjectId.current++, x: player.x + (player.direction === 'right' ? player.width : -C.BULLET_WIDTH), vx: (player.direction === 'right' ? 1 : -1) * C.BULLET_SPEED * (0.8 + Math.random() * 0.4), vy: (i - 2) * 1.5 });
        setBulletCooldown(C.BULLET_COOLDOWN * 2.5);
      } else if (weapon.includes('grenade')) {
        audioService.playSound('shoot_grenade');
        newBullets.push({ ...commonProps, id: nextObjectId.current++, x: player.x + (player.direction === 'right' ? player.width / 2 : 0), vx: (player.direction === 'right' ? 1 : -1) * C.BULLET_SPEED * 0.7, vy: -10 });
        setBulletCooldown(C.BULLET_COOLDOWN * 3);
      } else { // Default to Rifle behavior
        audioService.playSound('shoot_rifle');
        newBullets.push({ ...commonProps, id: nextObjectId.current++, x: player.x + (player.direction === 'right' ? player.width : -C.BULLET_WIDTH), vx: (player.direction === 'right' ? 1 : -1) * C.BULLET_SPEED, vy: 0 });
        setBulletCooldown(C.BULLET_COOLDOWN);
      }
      setBullets(b => [...b, ...newBullets]);
    }

    // --- SPECIAL ABILITIES & MOVEMENT ABILITIES ---
    if (keysPressed.current['e'] && player.specialAbilityCooldown === 0) {
        setPlayer(p => ({...p, specialAbilityCooldown: C.SPECIAL_ABILITY_COOLDOWN}));
        const ability = player.hero.specialAbility.toLowerCase();
        if(ability.includes('turret')) {
            setTurrets(t => [...t, {id: nextObjectId.current++, type: 'turret', x: player.x, y: player.y, width: C.PLAYER_WIDTH, height: C.PLAYER_HEIGHT, life: C.TURRET_LIFESPAN, shootCooldown: 0, direction: player.direction}])
        } else if (ability.includes('invincib')) {
            setPlayer(p => ({...p, invincibilityTimer: C.INVINCIBILITY_DURATION}));
        } else if (ability.includes('cluster')) {
            for (let i = 0; i < 8; i++) {
                setBullets(b => [...b, {id: nextObjectId.current++, type: 'bullet', owner: 'player', weaponType: 'Grenade Launcher', x: player.x, y: player.y, width: C.BULLET_WIDTH, height: C.BULLET_HEIGHT, vx: (Math.random() - 0.5) * C.BULLET_SPEED, vy: -Math.random() * 12}])
            }
        }
        // Combined special + movement for dash strike for backwards compatibility
        if (ability.includes('dash')) {
             setPlayer(p => ({...p, dashTimer: 20, invincibilityTimer: 20}));
             audioService.playSound('dash');
        }
    }
    
    // Air Dash
    if (keysPressed.current['shift'] && movementAbility.includes('dash') && player.dashTimer <=0 && !onGround) {
        setPlayer(p => ({...p, dashTimer: 20, invincibilityTimer: 20}));
        audioService.playSound('dash');
    }

    // Grappling Hook
    if (movementAbility.includes('grappl') && keysPressed.current['q'] && !player.grapple) {
        const grappleTarget = findGrapplePoint(player, crates);
        if (grappleTarget) {
            const dx = grappleTarget.x - (player.x + player.width / 2);
            const dy = grappleTarget.y - (player.y + player.height / 2);
            const length = Math.sqrt(dx * dx + dy * dy);
            setPlayer(p => ({...p, grapple: { isGrappling: true, target: grappleTarget, length: length, angle: Math.atan2(dy, dx), speed: 0}}));
        }
    }

    if (player.grapple?.isGrappling && player.grapple.target) {
        const grapple = player.grapple;
        const target = grapple.target;
        const dx = target.x - (player.x + player.width / 2);
        const dy = target.y - (player.y + player.height / 2);
        const currentLength = Math.sqrt(dx * dx + dy * dy);

        const force = (currentLength - grapple.length) * 0.1;
        grapple.speed += force / 10;
        grapple.speed *= 0.99; // Damping
        grapple.angle += grapple.speed;

        const newPlayerX = target.x - Math.cos(grapple.angle) * grapple.length - player.width / 2;
        const newPlayerY = target.y - Math.sin(grapple.angle) * grapple.length - player.height / 2;
        
        newX = newPlayerX;
        newYVelocity = newPlayerY - player.y;

        if (!keysPressed.current['q']) {
            setPlayer(p => ({...p, grapple: null}));
        }
    } else if (player.grapple && !keysPressed.current['q']) {
        setPlayer(p => ({...p, grapple: null}));
    }

    // --- SPIKE PIT COLLISION ---
    for (const spikePit of spikePits) {
        if (checkCollision(player, spikePit) && !player.isInvincible) {
            setPlayer(p => ({...p, health: 0, damageFlash: 30}));
            triggerScreenShake(10, 500);
        }
    }

    // --- ENEMY & PLAYER COLLISION ---
    for (const enemy of enemies) {
        if (checkCollision(player, enemy) && !player.isInvincible) {
            const damage = enemy.behavior === 'charge' ? 20 : 10;
            setPlayer(p => ({...p, health: p.health - damage, damageFlash: 30, isInvincible: true, invincibilityTimer: 60}));
            triggerScreenShake(5, 200);
        }
    }

    // --- ENEMY LOGIC ---
    setEnemies(prevEnemies => {
        const newBullets: Bullet[] = [];
        const updatedEnemies = prevEnemies.map(enemy => {
            let newEnemy = { ...enemy };
            const playerCenter = { x: player.x + player.width / 2, y: player.y + player.height / 2 };
            const enemyCenter = { x: newEnemy.x + newEnemy.width / 2, y: newEnemy.y + newEnemy.height / 2 };
            const dx = playerCenter.x - enemyCenter.x;
            const dy = playerCenter.y - enemyCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Common logic: face player
            if (dx > 0) newEnemy.direction = 'right';
            else newEnemy.direction = 'left';

            // Behavior-specific logic
            if (newEnemy.isBoss) {
                if (!newEnemy.attackPattern || newEnemy.attackPatternCooldown <= 0) {
                    const patterns = ['spread', 'beam', 'hail'];
                    newEnemy.attackPattern = patterns[Math.floor(Math.random() * patterns.length)] as 'spread' | 'beam' | 'hail';
                    newEnemy.attackPatternCooldown = 240;
                }
                newEnemy.attackPatternCooldown--;

                switch (newEnemy.attackPattern) {
                    case 'spread':
                        if (newEnemy.shootCooldown <= 0) {
                            for (let i = 0; i < 5; i++) {
                                newBullets.push({
                                    id: nextObjectId.current++, type: 'bullet', owner: 'enemy', weaponType: 'Rifle',
                                    x: newEnemy.x, y: newEnemy.y + newEnemy.height / 2,
                                    vx: (newEnemy.direction === 'right' ? 1 : -1) * C.BULLET_SPEED * (0.8 + Math.random() * 0.4), vy: (i - 2) * 1.5,
                                    width: C.BULLET_WIDTH, height: C.BULLET_HEIGHT
                                });
                            }
                            newEnemy.shootCooldown = 60;
                        }
                        break;
                    case 'beam':
                        if (newEnemy.shootCooldown <= 0) {
                            newBullets.push({
                                id: nextObjectId.current++, type: 'bullet', owner: 'enemy', weaponType: 'Rifle',
                                x: newEnemy.x, y: newEnemy.y + newEnemy.height / 2,
                                vx: dx / distance * C.BULLET_SPEED * 1.5, vy: dy / distance * C.BULLET_SPEED * 1.5,
                                width: C.BULLET_WIDTH * 3, height: C.BULLET_HEIGHT * 3
                            });
                            newEnemy.shootCooldown = 90;
                        }
                        break;
                    case 'hail':
                        if (newEnemy.shootCooldown % 10 === 0) {
                            newBullets.push({
                                id: nextObjectId.current++, type: 'bullet', owner: 'enemy', weaponType: 'Rifle',
                                x: Math.random() * C.GAME_WIDTH, y: 0,
                                vx: 0, vy: C.BULLET_SPEED,
                                width: C.BULLET_WIDTH, height: C.BULLET_HEIGHT
                            });
                        }
                        newEnemy.shootCooldown = 120;
                        break;
                }

            } else {
                switch (newEnemy.behavior) {
                    case 'fly':
                        newEnemy.y += dy / distance * newEnemy.moveSpeed / 2;
                        newEnemy.x += dx / distance * newEnemy.moveSpeed / 2;
                        if (newEnemy.shootCooldown <= 0 && distance < 400) {
                            newBullets.push({
                                id: nextObjectId.current++, type: 'bullet', owner: 'enemy', weaponType: 'Rifle',
                                x: newEnemy.x, y: newEnemy.y + newEnemy.height / 2,
                                vx: dx / distance * C.BULLET_SPEED * 0.5, vy: dy / distance * C.BULLET_SPEED * 0.5,
                                width: C.BULLET_WIDTH, height: C.BULLET_HEIGHT
                            });
                            newEnemy.shootCooldown = 120;
                        }
                        break;
                    case 'charge':
                        newEnemy.x += dx / distance * newEnemy.moveSpeed * 1.5;
                        // Simple ground check
                        const groundY = C.GAME_HEIGHT - 50 - newEnemy.height;
                        if (newEnemy.y < groundY) {
                            newEnemy.y += C.GRAVITY * 2;
                        }
                        if (newEnemy.y > groundY) {
                            newEnemy.y = groundY;
                        }
                        break;
                    case 'shoot':
                    default:
                        // Standard ground movement
                        newEnemy.x += (newEnemy.direction === 'right' ? 1 : -1) * newEnemy.moveSpeed;
                        if (newEnemy.x <= 0 || newEnemy.x >= C.GAME_WIDTH - newEnemy.width) {
                            newEnemy.direction = newEnemy.direction === 'left' ? 'right' : 'left';
                        }
                        if (newEnemy.shootCooldown <= 0 && distance < 300 && Math.abs(dy) < 50) {
                            newBullets.push({
                                id: nextObjectId.current++, type: 'bullet', owner: 'enemy', weaponType: 'Rifle',
                                x: newEnemy.x, y: newEnemy.y + newEnemy.height / 2,
                                vx: (newEnemy.direction === 'right' ? 1 : -1) * C.BULLET_SPEED * 0.7, vy: 0,
                                width: C.BULLET_WIDTH, height: C.BULLET_HEIGHT
                            });
                            newEnemy.shootCooldown = 150;
                        }
                        break;
                }
            }

            // Common logic: cooldowns and collision with platforms
            newEnemy.shootCooldown = Math.max(0, newEnemy.shootCooldown - 1);
            
            for(const platform of crates) {
                if(checkCollision(newEnemy, platform)) {
                    if (newEnemy.behavior !== 'fly') {
                        newEnemy.y = platform.y - newEnemy.height;
                    }
                }
            }

            return newEnemy;
        });
        
        if (newBullets.length > 0) {
            setBullets(b => [...b, ...newBullets]);
        }

        return updatedEnemies;
    });
    
    if (enemies.length === 0 && cages.length === 0) {
        setDifficulty(d => d + 1);
    }
    
}, [player, yVelocity, bulletCooldown, bullets, crates, cages, score, difficulty, characters, swapHero, onGameOver, screenShake.magnitude, isPaused]);

const findGrapplePoint = (player: Player, platforms: Crate[]): {x: number, y: number} | null => {
    const direction = player.direction === 'right' ? 1 : -1;
    const startX = player.x + player.width / 2;
    const startY = player.y + player.height / 2;

    for (let i = 0; i < 20; i++) {
        const checkX = startX + direction * i * 15;
        const checkY = startY - i * 10;

        for (const platform of platforms) {
            if (checkX > platform.x && checkX < platform.x + platform.width && checkY > platform.y && checkY < platform.y + platform.height) {
                return { x: checkX, y: platform.y };
            }
        }
    }
    return null;
};

  useGameLoop(gameLoop);

  const handleMuteToggle = () => {
      const newMuteState = audioService.toggleMute();
      setIsMuted(newMuteState);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
          setIsPaused(p => !p);
      }
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === 'w' || e.key === 'ArrowUp') {
        jumpBufferCounter.current = 6;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const gamepads = navigator.getGamepads();
      if (gamepads[0]) {
        const gamepad = gamepads[0];
        keysPressed.current['a'] = gamepad.axes[0] < -0.5;
        keysPressed.current['d'] = gamepad.axes[0] > 0.5;
        keysPressed.current['w'] = gamepad.buttons[12].pressed;
        keysPressed.current['s'] = gamepad.buttons[13].pressed;
        keysPressed.current[' '] = gamepad.buttons[0].pressed;
        keysPressed.current['e'] = gamepad.buttons[1].pressed;
        keysPressed.current['shift'] = gamepad.buttons[2].pressed;
        keysPressed.current['q'] = gamepad.buttons[3].pressed;
        if (gamepad.buttons[9].pressed) {
            setIsPaused(p => !p);
        }
      }
    }, 1000/60);
    return () => clearInterval(interval);
  }, []);
  
  const Sprite = ({ entity, color, children, extraClasses='' } : {entity: GameEntityType, color: string, children?: React.ReactNode, extraClasses?: string}) => (
    <div className={`absolute overflow-hidden ${color} ${extraClasses}`} style={{left:entity.x, top:entity.y, width:entity.width, height:entity.height, transform: (entity.type === 'player' || entity.type === 'enemy') && entity.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}}>
      {children}
    </div>
  );
  
  const PlayerSprite = () => {
    let classes = 'bg-transparent';
    if(player.isInvincible && !player.dashTimer) classes += ' opacity-50';
    if(player.damageFlash > 0) classes += ' flash-damage';
    if(player.dashTimer > 0) classes += ' opacity-75';
    if(player.isWallSliding) classes += ' border-4 border-cyan-400';
    if(player.isFlying) classes += ' glow';
    if(player.isGliding) classes += ' wind-lines';

    return (
        <Sprite entity={player} color={classes} >
          {player.hero.imageUrl && <img src={player.hero.imageUrl} alt={player.hero.name} className="w-full h-full object-contain" style={{transform: player.isWallSliding ? (player.direction === 'left' ? 'scaleX(1)' : 'scaleX(-1)') : ''}} />}
          <div className="absolute -top-4 text-xs text-white whitespace-rap" style={{transform: player.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}}>{player.hero.name}</div>
        </Sprite>
    );
  }

  const PauseMenu = () => (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
        <h2 className="text-5xl text-yellow-400 mb-8 uppercase">Paused</h2>
        <div className="flex flex-col gap-4">
            <Button onClick={() => setIsPaused(false)} className="!text-2xl !px-8 !py-4">Resume</Button>
            <Button onClick={onExit} className="!text-2xl !px-8 !py-4">Exit to Menu</Button>
            <Button onClick={handleMuteToggle} className="!text-2xl !px-8 !py-4 !bg-blue-600 hover:!bg-blue-700">
                {isMuted ? 'Unmute' : 'Mute'}
            </Button>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <div style={{ width: C.GAME_WIDTH, height: C.GAME_HEIGHT, transform: `translate(${screenShake.x}px, ${screenShake.y}px)` }} className="relative bg-gradient-to-t from-gray-700 to-gray-800 overflow-hidden border-4 border-gray-600 transition-transform duration-75">
        {isPaused && <PauseMenu />}
        
        {player.grapple?.isGrappling && player.grapple.target && (
            <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 10, pointerEvents: 'none' }}>
                <line 
                    x1={player.x + player.width / 2} 
                    y1={player.y + player.height / 2} 
                    x2={player.grapple.target.x} 
                    y2={player.grapple.target.y} 
                    stroke="white" 
                    strokeWidth="2" 
                />
            </svg>
        )}

        {crates.map(c => <Sprite key={c.id} entity={c} color="bg-yellow-900/80 border-2 border-yellow-900" />)}
        {cages.map(c => <Sprite key={c.id} entity={c} color="bg-gray-500/50 border-4 border-gray-400 flex items-center justify-center text-3xl text-white">?</Sprite>)}
        {spikePits.map(s => <Sprite key={s.id} entity={s} color="bg-red-900/80 border-t-4 border-red-500" />)}
        
        <PlayerSprite />

        {enemies.map(e => <Sprite key={e.id} entity={e} color={e.isBoss ? 'bg-transparent' : 'bg-transparent'} extraClasses={e.damageFlash > 0 ? 'flash-damage' : ''}>
            {e.villain.imageUrl && <img src={e.villain.imageUrl} alt={e.villain.name} className="w-full h-full object-contain" />}
            <div className="absolute w-full -top-4">
                <div className="h-2 bg-gray-800"><div className="h-full bg-red-500" style={{width: `${(e.health/e.maxHealth)*100}%`}}></div></div>
            </div>
        </Sprite>)}

        {turrets.map(t => <Sprite key={t.id} entity={t} color="bg-gray-600 border-2 border-gray-400" />)}

        {bullets.map(b => <Sprite key={b.id} entity={b} color={b.owner === 'player' ? 'bg-yellow-400 rounded-full' : 'bg-pink-500 rounded-full'} />)}
        
        {explosions.map(e => <div key={e.id} className="absolute bg-orange-500 rounded-full explosion-anim" style={{left:e.x - e.width/2, top:e.y-e.height/2, width:e.width, height:e.height}}></div>)}
        
        <div className="absolute bottom-0 left-0 w-full h-12 bg-gray-800/50"></div>

        <div className="absolute top-2 left-2 text-white text-xl uppercase">Score: {score}</div>
        <div className="absolute top-2 right-2 text-white text-xl uppercase">Difficulty: {difficulty + 1}</div>

        <div className="absolute bottom-2 left-2 text-white flex items-center gap-4">
            <div>
                <div className="text-lg uppercase">{player.hero.name} <span className='text-sm text-yellow-300'>x{player.lives}</span></div>
                <div className="w-48 h-4 bg-gray-700 border-2 border-gray-400">
                    <div className="h-full bg-green-500 transition-all duration-200" style={{width: `${(player.health/player.maxHealth)*100}%`}}></div>
                </div>
            </div>
            <div className="text-center">
                <div className="text-sm uppercase">Special (E)</div>
                 <div className="w-24 h-4 bg-gray-700 border-2 border-gray-400">
                    <div className="h-full bg-purple-500" style={{width: `${100 - (player.specialAbilityCooldown/C.SPECIAL_ABILITY_COOLDOWN)*100}%`}}></div>
                </div>
            </div>
        </div>
        <button onClick={() => setIsPaused(p => !p)} className="absolute top-2 right-1/2 translate-x-1/2 text-white p-2 rounded-full bg-black/20 hover:bg-black/40">
            {isPaused ? <IoPlay size={24} /> : <IoPause size={24} />}
        </button>
      </div>
    </div>
  );
};

export default GameScreen;
