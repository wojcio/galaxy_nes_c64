/**
 * GALAXY - 8-Bit NES Arcade Shooter Engine
 * Authentic Galaga / Galaxian mechanics, flight physics, and state machine
 */

import { SpriteCache, NES_PALETTE } from './sprites.js';
import { NesAudio } from './nes-audio.js';
import { Starfield } from './starfield.js';

export const CANVAS_WIDTH = 288;
export const CANVAS_HEIGHT = 384;

// Enemy types and scoring
export const ENEMY_TYPES = {
  BEE: {
    name: 'bee',
    pointsFormation: 50,
    pointsDiving: 100,
    hp: 1,
    sprite: 'bee',
    width: 16,
    height: 16
  },
  BUTTERFLY: {
    name: 'butterfly',
    pointsFormation: 80,
    pointsDiving: 160,
    hp: 1,
    sprite: 'butterfly',
    width: 16,
    height: 16
  },
  BOSS: {
    name: 'boss',
    pointsFormation: 150,
    pointsDiving: 400,
    hp: 2,
    spriteGreen: 'bossGreen',
    spriteBlue: 'bossBlue',
    width: 16,
    height: 16
  }
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.sprites = new SpriteCache();
    this.audio = new NesAudio();
    this.starfield = new Starfield(CANVAS_WIDTH, CANVAS_HEIGHT);

    // High score from localStorage
    this.highScore = parseInt(localStorage.getItem('galaxy_highscore') || '10000', 10);
    this.score = 0;
    this.lives = 3;
    this.stage = 1;

    // Game States: 'TITLE', 'STAGE_INTRO', 'PLAYING', 'PLAYER_DEAD', 'STAGE_CLEAR', 'GAME_OVER'
    this.state = 'TITLE';
    this.stateTimer = 0;

    // Keys state (WASD + Space)
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
      spaceJustPressed: false
    };

    // Entities
    this.player = null;
    this.playerBullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.explosions = [];
    this.floatingTexts = [];

    // Formation sway
    this.formationX = 0;
    this.formationDir = 1;
    this.formationTimer = 0;

    // Dive bombing director
    this.diveTimer = 0;
    this.diveInterval = 120; // Frames between dives

    // Global animation counter
    this.tick = 0;
    this.shootCooldown = 0;

    this.initInput();
    this.resetPlayer();
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) this.keys.w = true;
      if (['a', 'arrowleft'].includes(key)) this.keys.a = true;
      if (['s', 'arrowdown'].includes(key)) this.keys.s = true;
      if (['d', 'arrowright'].includes(key)) this.keys.d = true;
      if (key === ' ' || e.code === 'Space') {
        if (!this.keys.space) this.keys.spaceJustPressed = true;
        this.keys.space = true;
        e.preventDefault();
      }

      // Initialize audio on first user keypress
      this.audio.init();

      // Title screen press SPACE to start
      if (this.state === 'TITLE' && (key === ' ' || e.code === 'Space')) {
        this.startNewGame();
      } else if (this.state === 'GAME_OVER' && (key === ' ' || e.code === 'Space') && this.stateTimer > 90) {
        this.state = 'TITLE';
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) this.keys.w = false;
      if (['a', 'arrowleft'].includes(key)) this.keys.a = false;
      if (['s', 'arrowdown'].includes(key)) this.keys.s = false;
      if (['d', 'arrowright'].includes(key)) this.keys.d = false;
      if (key === ' ' || e.code === 'Space') {
        this.keys.space = false;
      }
    });

    // Also support mouse / touch click to unlock audio and start game
    this.canvas.addEventListener('click', () => {
      this.audio.init();
      if (this.state === 'TITLE') {
        this.startNewGame();
      } else if (this.state === 'GAME_OVER' && this.stateTimer > 90) {
        this.state = 'TITLE';
      }
    });
  }

  resetPlayer() {
    this.player = {
      x: CANVAS_WIDTH / 2 - 8,
      y: CANVAS_HEIGHT - 36,
      width: 16,
      height: 16,
      speed: 2.4,
      invulnerableTimer: 90, // Invulnerable blink frames after respawn
      alive: true
    };
  }

  startNewGame() {
    this.score = 0;
    this.lives = 3;
    this.stage = 1;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.explosions = [];
    this.floatingTexts = [];
    this.resetPlayer();
    this.startStage(1);
  }

  startStage(stageNum) {
    this.stage = stageNum;
    this.state = 'STAGE_INTRO';
    this.stateTimer = 0;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.diveInterval = Math.max(50, 130 - (this.stage * 12));
    this.spawnFormation();
    this.audio.playStartJingle();
  }

  spawnFormation() {
    this.enemies = [];
    // Grid: 8 columns x 4 rows
    // Row 0: 4 Bosses in center (cols 2, 3, 4, 5)
    // Row 1: 8 Butterflies
    // Row 2: 8 Yellow Bees
    // Row 3: 8 Yellow Bees
    const colSpacing = 24;
    const rowSpacing = 20;
    const gridStartX = 56;
    const gridStartY = 56;

    let id = 0;

    // Row 0: Bosses
    for (let c = 2; c <= 5; c++) {
      const targetX = gridStartX + c * colSpacing;
      const targetY = gridStartY + 0 * rowSpacing;
      this.enemies.push(this.createEnemy(id++, ENEMY_TYPES.BOSS, targetX, targetY, c));
    }

    // Row 1: Butterflies
    for (let c = 0; c < 8; c++) {
      const targetX = gridStartX + c * colSpacing;
      const targetY = gridStartY + 1 * rowSpacing;
      this.enemies.push(this.createEnemy(id++, ENEMY_TYPES.BUTTERFLY, targetX, targetY, c));
    }

    // Row 2: Bees
    for (let c = 0; c < 8; c++) {
      const targetX = gridStartX + c * colSpacing;
      const targetY = gridStartY + 2 * rowSpacing;
      this.enemies.push(this.createEnemy(id++, ENEMY_TYPES.BEE, targetX, targetY, c));
    }

    // Row 3: Bees
    for (let c = 0; c < 8; c++) {
      const targetX = gridStartX + c * colSpacing;
      const targetY = gridStartY + 3 * rowSpacing;
      this.enemies.push(this.createEnemy(id++, ENEMY_TYPES.BEE, targetX, targetY, c));
    }
  }

  createEnemy(id, type, targetX, targetY, col) {
    // Staggered entry animation swooping from top corners into grid
    const entryFromLeft = col % 2 === 0;
    const spawnX = entryFromLeft ? -20 : CANVAS_WIDTH + 20;
    const spawnY = -20 - (id * 10);

    return {
      id,
      type,
      hp: type.hp,
      maxHp: type.hp,
      x: spawnX,
      y: spawnY,
      width: type.width,
      height: type.height,
      targetX,
      targetY,
      state: 'ENTERING', // 'ENTERING', 'IN_FORMATION', 'DIVING', 'RETURNING'
      pathProgress: 0,
      pathSpeed: 0.02 + Math.min(0.02, this.stage * 0.003),
      diveAngle: 0,
      diveVx: 0,
      diveVy: 0,
      diveEscort: null,
      diveTimer: 0,
      animFrame: 0
    };
  }

  triggerDiveAttack() {
    if (this.state !== 'PLAYING' || !this.player.alive) return;

    // Find enemies in formation ready to dive
    const inFormation = this.enemies.filter(e => e.state === 'IN_FORMATION');
    if (inFormation.length === 0) return;

    // Pick 1 to 2 attackers
    const leaders = inFormation.filter(e => e.type === ENEMY_TYPES.BOSS || e.type === ENEMY_TYPES.BUTTERFLY);
    const candidate = leaders.length > 0 && Math.random() < 0.6
      ? leaders[Math.floor(Math.random() * leaders.length)]
      : inFormation[Math.floor(Math.random() * inFormation.length)];

    if (!candidate) return;

    this.startEnemyDive(candidate);
    this.audio.playDive();

    // If Boss dives, bring 1 or 2 escort bees/butterflies!
    if (candidate.type === ENEMY_TYPES.BOSS) {
      const availableEscorts = inFormation.filter(e => e.id !== candidate.id && e.type !== ENEMY_TYPES.BOSS);
      if (availableEscorts.length > 0) {
        const escort1 = availableEscorts[0];
        this.startEnemyDive(escort1, candidate, -18);
        if (availableEscorts.length > 1 && Math.random() < 0.7) {
          const escort2 = availableEscorts[1];
          this.startEnemyDive(escort2, candidate, 18);
        }
      }
    }
  }

  startEnemyDive(enemy, leader = null, offsetX = 0) {
    enemy.state = 'DIVING';
    enemy.diveTimer = 0;
    enemy.diveEscort = leader;
    enemy.escortOffset = offsetX;

    // Aim dive path towards player's position
    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const angle = Math.atan2(dy, dx);

    const baseSpeed = 2.2 + Math.min(1.8, this.stage * 0.3);
    enemy.diveVx = Math.cos(angle) * baseSpeed;
    enemy.diveVy = Math.max(1.8, Math.sin(angle) * baseSpeed);
  }

  shootPlayerLaser() {
    if (!this.player.alive) return;
    // Allow up to 4 simultaneous player bullets (2 double salvos)
    if (this.playerBullets.length >= 4) return;

    const bulletY = this.player.y - 4;
    // Dual sleek laser bolts
    this.playerBullets.push({
      x: this.player.x + 3,
      y: bulletY,
      width: 2,
      height: 8,
      speed: 6.5
    });
    this.playerBullets.push({
      x: this.player.x + 11,
      y: bulletY,
      width: 2,
      height: 8,
      speed: 6.5
    });

    this.audio.playShoot();
  }

  shootEnemyBullet(enemy) {
    if (this.enemyBullets.length >= 8) return;
    const dx = (this.player.x + 8) - (enemy.x + 8);
    const dy = (this.player.y + 8) - (enemy.y + 8);
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 2.6 + Math.min(1.5, this.stage * 0.2);

    this.enemyBullets.push({
      x: enemy.x + 7,
      y: enemy.y + 12,
      vx: (dx / dist) * speed,
      vy: Math.max(1.8, (dy / dist) * speed),
      width: 3,
      height: 5
    });

    this.audio.playEnemyShoot();
  }

  addExplosion(x, y, isBoss = false) {
    this.explosions.push({
      x: x - 4,
      y: y - 4,
      frame: 0,
      timer: 0,
      maxFrames: 5,
      isBoss
    });
    this.audio.playExplosion(isBoss);
  }

  addFloatingScore(x, y, text) {
    this.floatingTexts.push({
      x,
      y,
      text: text.toString(),
      timer: 45
    });
  }

  killPlayer() {
    if (!this.player.alive || this.player.invulnerableTimer > 0) return;

    this.player.alive = false;
    this.addExplosion(this.player.x, this.player.y, true);
    this.audio.playPlayerDeath();

    this.state = 'PLAYER_DEAD';
    this.stateTimer = 0;
  }

  // MAIN UPDATE LOOP
  update() {
    this.tick++;
    this.starfield.update();

    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }

    // Handle firing (single tap or hold space)
    if (this.state === 'PLAYING') {
      if (this.keys.spaceJustPressed || (this.keys.space && this.shootCooldown === 0)) {
        this.shootPlayerLaser();
        this.shootCooldown = 12; // ~200ms autofire cooldown
      }
    }
    this.keys.spaceJustPressed = false;

    // State machine updates
    switch (this.state) {
      case 'TITLE':
        // Nothing heavy, stars twinkle, wait for SPACE
        break;

      case 'STAGE_INTRO':
        this.stateTimer++;
        this.updateFormationIntro();
        if (this.stateTimer > 150) {
          this.state = 'PLAYING';
        }
        break;

      case 'PLAYING':
        this.updatePlayer();
        this.updateEnemies();
        this.updateProjectiles();
        this.checkCollisions();

        // Check if all enemies cleared
        if (this.enemies.length === 0) {
          this.state = 'STAGE_CLEAR';
          this.stateTimer = 0;
          this.audio.playStageClear();
        }
        break;

      case 'PLAYER_DEAD':
        this.stateTimer++;
        this.updateProjectiles();
        this.updateEnemies(false); // Move diving enemies without triggering new dives
        if (this.stateTimer > 100) {
          this.lives--;
          if (this.lives > 0) {
            this.resetPlayer();
            this.state = 'PLAYING';
          } else {
            this.state = 'GAME_OVER';
            this.stateTimer = 0;
            if (this.score > this.highScore) {
              this.highScore = this.score;
              localStorage.setItem('galaxy_highscore', this.highScore.toString());
            }
          }
        }
        break;

      case 'STAGE_CLEAR':
        this.stateTimer++;
        this.updateProjectiles();
        if (this.stateTimer > 120) {
          this.startStage(this.stage + 1);
        }
        break;

      case 'GAME_OVER':
        this.stateTimer++;
        break;
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.timer++;
      if (exp.timer % 4 === 0) {
        exp.frame++;
        if (exp.frame >= exp.maxFrames) {
          this.explosions.splice(i, 1);
        }
      }
    }

    // Update floating score texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.5;
      ft.timer--;
      if (ft.timer <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  updatePlayer() {
    if (!this.player.alive) return;

    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer--;
    }

    // WASD Directional movement
    if (this.keys.a) {
      this.player.x -= this.player.speed;
    }
    if (this.keys.d) {
      this.player.x += this.player.speed;
    }
    if (this.keys.w) {
      this.player.y -= this.player.speed;
    }
    if (this.keys.s) {
      this.player.y += this.player.speed;
    }

    // Boundaries clamping
    // Allow player full freedom in lower section (Y: 200 to 360)
    const minX = 8;
    const maxX = CANVAS_WIDTH - this.player.width - 8;
    const minY = 200;
    const maxY = CANVAS_HEIGHT - this.player.height - 12;

    this.player.x = Math.max(minX, Math.min(maxX, this.player.x));
    this.player.y = Math.max(minY, Math.min(maxY, this.player.y));
  }

  updateFormationIntro() {
    // Smooth swooping entrance to designated formation positions
    for (let enemy of this.enemies) {
      if (enemy.state === 'ENTERING') {
        enemy.pathProgress += enemy.pathSpeed;
        if (enemy.pathProgress >= 1.0) {
          enemy.x = enemy.targetX;
          enemy.y = enemy.targetY;
          enemy.state = 'IN_FORMATION';
        } else {
          // Curved entrance swoop
          const p = enemy.pathProgress;
          const startX = (enemy.id % 2 === 0) ? -20 : CANVAS_WIDTH + 20;
          const startY = 100;
          const controlX = CANVAS_WIDTH / 2;
          const controlY = 240;

          // Quadratic Bezier curve
          const inv = 1 - p;
          enemy.x = inv * inv * startX + 2 * inv * p * controlX + p * p * enemy.targetX;
          enemy.y = inv * inv * startY + 2 * inv * p * controlY + p * p * enemy.targetY;
        }
      }
    }
  }

  updateEnemies(allowDives = true) {
    // Formation breathing sway
    this.formationTimer += 0.035;
    this.formationX = Math.sin(this.formationTimer) * 14;

    // Periodic dive attacks
    if (allowDives && this.state === 'PLAYING') {
      this.diveTimer++;
      if (this.diveTimer >= this.diveInterval) {
        this.diveTimer = 0;
        this.triggerDiveAttack();
      }
    }

    // Update each enemy
    for (let enemy of this.enemies) {
      // Toggle wings animation frame
      if (this.tick % 16 === 0) {
        enemy.animFrame = 1 - enemy.animFrame;
      }

      if (enemy.state === 'IN_FORMATION') {
        enemy.x = enemy.targetX + this.formationX;
        enemy.y = enemy.targetY;
      } else if (enemy.state === 'DIVING') {
        enemy.diveTimer++;

        if (enemy.diveEscort) {
          // Check if escort leader is still alive and diving
          if (!this.enemies.includes(enemy.diveEscort) || enemy.diveEscort.state !== 'DIVING') {
            enemy.diveEscort = null;
            enemy.diveVx = (Math.random() - 0.5) * 2;
            enemy.diveVy = 2.4;
          } else {
            enemy.x = enemy.diveEscort.x + enemy.escortOffset;
            enemy.y = enemy.diveEscort.y + 4;
          }
        } else {
          // Independent dive trajectory with sinusoidal swoop
          enemy.x += enemy.diveVx + Math.sin(enemy.diveTimer * 0.1) * 1.5;
          enemy.y += enemy.diveVy;

          // Aliens shoot bullets during dive
          if (enemy.diveTimer === 35 || enemy.diveTimer === 65) {
            if (Math.random() < 0.75 + this.stage * 0.05) {
              this.shootEnemyBullet(enemy);
            }
          }
        }

        // Check if enemy flew off the bottom
        if (enemy.y > CANVAS_HEIGHT + 20) {
          // Wrap around to top and return to grid
          enemy.y = -20;
          enemy.x = enemy.targetX + this.formationX;
          enemy.state = 'RETURNING';
        }
      } else if (enemy.state === 'RETURNING') {
        // Fly down into formation slot
        const targetCurrX = enemy.targetX + this.formationX;
        const dx = targetCurrX - enemy.x;
        const dy = enemy.targetY - enemy.y;

        enemy.x += dx * 0.08;
        enemy.y += dy * 0.08;

        if (Math.hypot(dx, dy) < 2) {
          enemy.x = targetCurrX;
          enemy.y = enemy.targetY;
          enemy.state = 'IN_FORMATION';
          enemy.diveEscort = null;
        }
      }
    }
  }

  updateProjectiles() {
    // Player bullets (move straight up fast)
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.y -= b.speed;
      if (b.y < -10) {
        this.playerBullets.splice(i, 1);
      }
    }

    // Enemy bullets (move along their velocity vector)
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx;
      eb.y += eb.vy;
      if (eb.y > CANVAS_HEIGHT + 10 || eb.x < -10 || eb.x > CANVAS_WIDTH + 10) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    // 1. Player Bullets vs Enemies
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const b = this.playerBullets[bi];
      let bulletHit = false;

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        if (
          b.x < enemy.x + enemy.width &&
          b.x + b.width > enemy.x &&
          b.y < enemy.y + enemy.height &&
          b.y + b.height > enemy.y
        ) {
          bulletHit = true;
          enemy.hp--;

          if (enemy.hp <= 0) {
            // Enemy destroyed!
            const isDiving = enemy.state === 'DIVING' || enemy.state === 'RETURNING';
            const pts = isDiving ? enemy.type.pointsDiving : enemy.type.pointsFormation;
            this.score += pts;
            this.addFloatingScore(enemy.x, enemy.y, `+${pts}`);
            this.addExplosion(enemy.x, enemy.y, enemy.type === ENEMY_TYPES.BOSS);
            this.enemies.splice(ei, 1);
          } else {
            // Boss first hit (turns blue)
            this.score += 50;
            this.audio.playHit();
          }
          break;
        }
      }

      if (bulletHit) {
        this.playerBullets.splice(bi, 1);
      }
    }

    // 2. Enemy Bullets vs Player
    if (this.player.alive && this.player.invulnerableTimer <= 0) {
      const px = this.player.x + 2;
      const py = this.player.y + 2;
      const pw = this.player.width - 4;
      const ph = this.player.height - 4;

      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const eb = this.enemyBullets[i];
        if (
          eb.x < px + pw &&
          eb.x + eb.width > px &&
          eb.y < py + ph &&
          eb.y + eb.height > py
        ) {
          this.enemyBullets.splice(i, 1);
          this.killPlayer();
          break;
        }
      }

      // 3. Enemy Ship Body vs Player Ship
      if (this.player.alive) {
        for (let enemy of this.enemies) {
          if (
            enemy.x < px + pw &&
            enemy.x + enemy.width > px &&
            enemy.y < py + ph &&
            enemy.y + enemy.height > py
          ) {
            this.killPlayer();
            break;
          }
        }
      }
    }
  }

  // RENDER PIPELINE
  draw() {
    this.ctx.fillStyle = NES_PALETTE['0'];
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Starfield background
    this.starfield.draw(this.ctx);

    // 2. Explosions
    for (let exp of this.explosions) {
      const spr = this.sprites.get('explosion', exp.frame);
      if (spr) {
        this.ctx.drawImage(spr, Math.floor(exp.x), Math.floor(exp.y));
      }
    }

    // 3. Enemies
    for (let enemy of this.enemies) {
      let spriteName = enemy.type.sprite;
      if (enemy.type === ENEMY_TYPES.BOSS) {
        spriteName = (enemy.hp === 2) ? enemy.type.spriteGreen : enemy.type.spriteBlue;
      }
      const spr = this.sprites.get(spriteName, enemy.animFrame);
      if (spr) {
        this.ctx.save();
        this.ctx.translate(Math.floor(enemy.x + enemy.width / 2), Math.floor(enemy.y + enemy.height / 2));
        // Rotate sprite towards diving direction if diving
        if (enemy.state === 'DIVING') {
          const angle = Math.atan2(enemy.diveVy, enemy.diveVx) - Math.PI / 2;
          this.ctx.rotate(angle);
        }
        this.ctx.drawImage(spr, -enemy.width / 2, -enemy.height / 2);
        this.ctx.restore();
      }
    }

    // 4. Enemy Bullets (pulsing red/yellow 8-bit orbs)
    for (let eb of this.enemyBullets) {
      this.ctx.fillStyle = (this.tick % 6 < 3) ? NES_PALETTE['R'] : NES_PALETTE['Y'];
      this.ctx.fillRect(Math.floor(eb.x), Math.floor(eb.y), eb.width, eb.height);
      this.ctx.fillStyle = NES_PALETTE['W'];
      this.ctx.fillRect(Math.floor(eb.x + 1), Math.floor(eb.y + 1), 1, eb.height - 2);
    }

    // 5. Player Bullets (dual cyan/white energy bolts)
    for (let b of this.playerBullets) {
      this.ctx.fillStyle = NES_PALETTE['C'];
      this.ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.width, b.height);
      this.ctx.fillStyle = NES_PALETTE['W'];
      this.ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.width, 2);
    }

    // 6. Player Ship
    if (this.player.alive) {
      // Blinking during invulnerability
      const visible = (this.player.invulnerableTimer === 0) || (Math.floor(this.player.invulnerableTimer / 4) % 2 === 0);
      if (visible) {
        const flameFrame = (this.tick % 8 < 4) ? 0 : 1;
        const spr = this.sprites.get('player', flameFrame);
        if (spr) {
          this.ctx.drawImage(spr, Math.floor(this.player.x), Math.floor(this.player.y));
        }
      }
    }

    // 7. Floating Score Points
    for (let ft of this.floatingTexts) {
      this.drawText(ft.text, Math.floor(ft.x), Math.floor(ft.y), NES_PALETTE['Y'], 8);
    }

    // 8. HUD & Overlays
    this.drawHUD();

    // 9. State-specific banners
    if (this.state === 'TITLE') {
      this.drawTitleScreen();
    } else if (this.state === 'STAGE_INTRO') {
      this.drawText(`STAGE ${this.stage}`, CANVAS_WIDTH / 2 - 32, 180, NES_PALETTE['C'], 10);
      this.drawText('READY', CANVAS_WIDTH / 2 - 20, 204, NES_PALETTE['R'], 10);
    } else if (this.state === 'STAGE_CLEAR') {
      this.drawText('STAGE CLEAR!', CANVAS_WIDTH / 2 - 46, 180, NES_PALETTE['g'], 10);
    } else if (this.state === 'GAME_OVER') {
      this.drawText('GAME OVER', CANVAS_WIDTH / 2 - 38, 180, NES_PALETTE['R'], 10);
      if (this.stateTimer > 90 && Math.floor(this.tick / 20) % 2 === 0) {
        this.drawText('PUSH SPACE', CANVAS_WIDTH / 2 - 40, 210, NES_PALETTE['W'], 8);
      }
    }
  }

  drawHUD() {
    // Top Bar: 1UP & HIGH SCORE
    this.drawText('1UP', 24, 8, NES_PALETTE['R'], 8);
    this.drawText(this.formatScore(this.score), 18, 18, NES_PALETTE['W'], 8);

    this.drawText('HIGH SCORE', CANVAS_WIDTH / 2 - 36, 8, NES_PALETTE['R'], 8);
    this.drawText(this.formatScore(this.highScore), CANVAS_WIDTH / 2 - 16, 18, NES_PALETTE['W'], 8);

    // Bottom Bar: Remaining Lives (mini-ships)
    for (let i = 0; i < this.lives - 1; i++) {
      const spr = this.sprites.get('player', 0);
      if (spr) {
        this.ctx.drawImage(spr, 10 + i * 14, CANVAS_HEIGHT - 16, 12, 12);
      }
    }

    // Bottom Bar: Stage Badges (flags at bottom right)
    const stageFlags = Math.min(this.stage, 8);
    for (let i = 0; i < stageFlags; i++) {
      const flagSpr = this.sprites.get('flag1', 0);
      if (flagSpr) {
        this.ctx.drawImage(flagSpr, CANVAS_WIDTH - 20 - (i * 12), CANVAS_HEIGHT - 16, 12, 12);
      }
    }
  }

  drawTitleScreen() {
    // Dim background slightly
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Classic NES Title Logo
    this.drawText('G A L A X Y', CANVAS_WIDTH / 2 - 58, 64, NES_PALETTE['y'], 14);
    this.drawText('1985 NINTENDO APU', CANVAS_WIDTH / 2 - 64, 84, NES_PALETTE['C'], 8);

    // Score Table
    this.drawText('- POINT TABLE -', CANVAS_WIDTH / 2 - 56, 120, NES_PALETTE['W'], 8);

    // Bee preview
    const bee = this.sprites.get('bee', 0);
    if (bee) this.ctx.drawImage(bee, 60, 140);
    this.drawText('=  50 PTS', 88, 144, NES_PALETTE['Y'], 8);

    // Butterfly preview
    const bfly = this.sprites.get('butterfly', 0);
    if (bfly) this.ctx.drawImage(bfly, 60, 164);
    this.drawText('=  80 PTS', 88, 168, NES_PALETTE['R'], 8);

    // Boss preview
    const boss = this.sprites.get('bossGreen', 0);
    if (boss) this.ctx.drawImage(boss, 60, 188);
    this.drawText('= 150 PTS', 88, 192, NES_PALETTE['g'], 8);

    // Controls reminder
    this.drawText('CONTROLS:', CANVAS_WIDTH / 2 - 34, 230, NES_PALETTE['M'], 8);
    this.drawText('WASD  : MOVE', CANVAS_WIDTH / 2 - 44, 246, NES_PALETTE['W'], 8);
    this.drawText('SPACE : FIRE', CANVAS_WIDTH / 2 - 44, 260, NES_PALETTE['W'], 8);

    // Blinking "PUSH SPACE TO START"
    if (Math.floor(this.tick / 24) % 2 === 0) {
      this.drawText('PUSH SPACE TO START', CANVAS_WIDTH / 2 - 76, 310, NES_PALETTE['y'], 8);
    }
  }

  formatScore(val) {
    let s = val.toString();
    while (s.length < 5) s = '0' + s;
    return s;
  }

  /**
   * Crisp 8-bit font rendering
   */
  drawText(text, x, y, color = '#ffffff', size = 8) {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px 'Press Start 2P', monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
  }
}
