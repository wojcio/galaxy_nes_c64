/**
 * COMMODORE 64 GALAXY EMULATOR & RUNTIME
 * Emulates C64 VIC-II 40x25 Screen, PETSCII character set, and SID 6581 sound chip
 */

(function () {
  'use strict';

  // Authentic C64 Pepto Color Palette
  const C64_PALETTE = [
    '#000000', // 0: Black
    '#FFFFFF', // 1: White
    '#880000', // 2: Red
    '#AAFFEE', // 3: Cyan
    '#CC44CC', // 4: Purple
    '#00CC55', // 5: Green
    '#0000AA', // 6: Blue
    '#EEEE77', // 7: Yellow
    '#DD8855', // 8: Orange
    '#664400', // 9: Brown
    '#FF7777', // 10: Light Red
    '#333333', // 11: Dark Gray
    '#777777', // 12: Medium Gray
    '#AAFF66', // 13: Light Green
    '#0088FF', // 14: Light Blue
    '#BBBBBB'  // 15: Light Gray
  ];

  // SID 6581 Synthesizer Emulation
  class Sid6581 {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.noiseBuffer = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.28;
        this.master.connect(this.ctx.destination);

        // Generate C64 LFSR noise buffer
        const rate = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, rate, rate);
        const d = buf.getChannelData(0);
        let shift = 0x7FFFF8;
        for (let i = 0; i < rate; i++) {
          const bit = ((shift >> 22) ^ (shift >> 17)) & 1;
          shift = ((shift << 1) | bit) & 0x7FFFFF;
          d[i] = ((shift & 0xFF) / 128.0 - 1.0) * 0.7;
        }
        this.noiseBuffer = buf;
        this.initialized = true;
      } catch (e) {
        console.warn('SID Audio not supported:', e);
      }
    }

    playLaser() {
      if (!this.initialized || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    playExplode() {
      if (!this.initialized || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.35);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(t);
        src.stop(t + 0.35);
      }
    }

    playPowerup() {
      if (!this.initialized || !this.ctx) return;
      const t = this.ctx.currentTime + 0.02;
      const notes = [261.6, 329.6, 392.0, 523.2, 659.2, 784.0];
      notes.forEach((f, i) => {
        const start = t + i * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.1);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(start);
        osc.stop(start + 0.1);
      });
    }

    playShield() {
      if (!this.initialized || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.setValueAtTime(600, t + 0.04);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.14);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.14);
    }
  }

  // 40x25 VIC-II Screen Matrix
  const COLS = 40;
  const ROWS = 25;
  const CHAR_W = 8;
  const CHAR_H = 8;
  const BORDER_X = 32;
  const BORDER_Y = 24;

  class C64Galaxy {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      this.sid = new Sid6581();

      // Screen buffers
      this.screen = new Uint8Array(COLS * ROWS);
      this.colors = new Uint8Array(COLS * ROWS);

      this.borderColor = 14; // Light Blue border
      this.bgColor = 6;      // Dark Blue background

      // State: 'BOOT', 'READY', 'GAME'
      this.state = 'BOOT';
      this.bootTimer = 0;

      // Entities
      this.px = 18;
      this.py = 22;
      this.lives = 3;
      this.score = 0;
      this.highScore = 10000;
      this.weapon = 'NORMAL';
      this.shield = 0;
      this.shootCooldown = 0;

      this.stars = [];
      this.enemies = [];
      this.pBullets = [];
      this.missiles = [];
      this.eBullets = [];
      this.drops = [];

      this.formationSway = 0;
      this.formationDir = 1;
      this.tick = 0;

      this.keys = { left: false, right: false, up: false, down: false, fire: false };

      this.initInput();
      this.initStars();
      this.initFormation();
    }

    initInput() {
      window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (['a', 'arrowleft'].includes(k)) this.keys.left = true;
        if (['d', 'arrowright'].includes(k)) this.keys.right = true;
        if (['w', 'arrowup'].includes(k)) this.keys.up = true;
        if (['s', 'arrowdown'].includes(k)) this.keys.down = true;
        if (k === ' ' || e.code === 'Space') {
          this.keys.fire = true;
          e.preventDefault();
        }
        this.sid.init();

        if (this.state === 'BOOT' || this.state === 'READY') {
          this.startGame();
        }
      });

      window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (['a', 'arrowleft'].includes(k)) this.keys.left = false;
        if (['d', 'arrowright'].includes(k)) this.keys.right = false;
        if (['w', 'arrowup'].includes(k)) this.keys.up = false;
        if (['s', 'arrowdown'].includes(k)) this.keys.down = false;
        if (k === ' ' || e.code === 'Space') this.keys.fire = false;
      });

      this.canvas.addEventListener('click', () => {
        this.sid.init();
        if (this.state === 'BOOT' || this.state === 'READY') {
          this.startGame();
        }
      });
    }

    initStars() {
      this.stars = [];
      for (let i = 0; i < 22; i++) {
        this.stars.push({
          x: Math.floor(Math.random() * 38) + 1,
          y: Math.floor(Math.random() * 23) + 1,
          speed: (i % 3) + 1,
          ch: (i % 3 === 2) ? '*' : ((i % 3 === 1) ? '+' : '.'),
          color: (i % 3 === 2) ? 1 : ((i % 3 === 1) ? 3 : 15)
        });
      }
    }

    initFormation() {
      this.enemies = [];
      // Row 0: 4 Bosses (Green/Yellow)
      for (let c = 2; c <= 5; c++) {
        this.enemies.push({
          x: 6 + c * 5,
          y: 4,
          origX: 6 + c * 5,
          origY: 4,
          type: 2, // Boss
          hp: 2,
          state: 0,
          timer: 0
        });
      }
      // Row 1: 8 Butterflies (Red)
      for (let c = 0; c < 8; c++) {
        this.enemies.push({
          x: 2 + c * 4,
          y: 6,
          origX: 2 + c * 4,
          origY: 6,
          type: 1, // Butterfly
          hp: 1,
          state: 0,
          timer: 0
        });
      }
      // Row 2: 8 Bees (Yellow)
      for (let c = 0; c < 8; c++) {
        this.enemies.push({
          x: 2 + c * 4,
          y: 8,
          origX: 2 + c * 4,
          origY: 8,
          type: 0, // Bee
          hp: 1,
          state: 0,
          timer: 0
        });
      }
    }

    startGame() {
      this.state = 'GAME';
      this.borderColor = 0; // Black border during game
      this.bgColor = 0;     // Black background
      this.px = 18;
      this.py = 22;
      this.score = 0;
      this.lives = 3;
      this.weapon = 'NORMAL';
      this.shield = 0;
      this.pBullets = [];
      this.missiles = [];
      this.eBullets = [];
      this.drops = [];
      this.initFormation();
      this.sid.playPowerup();
    }

    shoot() {
      this.sid.playLaser();

      if (this.weapon === 'RAPID') {
        this.shootCooldown = 4;
        this.pBullets.push({ x: this.px, y: this.py - 1, vy: -1.2 });
        this.pBullets.push({ x: this.px + 2, y: this.py - 1, vy: -1.2 });
      } else if (this.weapon === 'MISSILES') {
        this.shootCooldown = 8;
        this.pBullets.push({ x: this.px + 1, y: this.py - 1, vy: -1.0 });
        this.missiles.push({ x: this.px + 1, y: this.py - 1, type: 'HOMING' });
      } else if (this.weapon === 'HYPER') {
        this.shootCooldown = 7;
        this.missiles.push({ x: this.px, y: this.py - 1, type: 'HYPER', vx: -0.3, vy: -1.2 });
        this.missiles.push({ x: this.px + 2, y: this.py - 1, type: 'HYPER', vx: 0.3, vy: -1.2 });
      } else {
        this.shootCooldown = 7;
        this.pBullets.push({ x: this.px + 1, y: this.py - 1, vy: -1.0 });
      }
    }

    checkDrop(x, y) {
      if (Math.random() < 0.35) {
        const types = [
          { type: 'R', color: 7 },  // Rapid
          { type: 'M', color: 10 }, // Missile
          { type: 'H', color: 4 },  // Hyper
          { type: 'S', color: 3 }   // Shield
        ];
        const pick = types[Math.floor(Math.random() * types.length)];
        this.drops.push({
          x: Math.floor(x),
          y: Math.floor(y),
          type: pick.type,
          color: pick.color,
          wobble: 0
        });
      }
    }

    update() {
      this.tick++;

      if (this.state === 'BOOT') {
        this.bootTimer++;
        if (this.bootTimer > 180) {
          this.state = 'READY';
        }
        return;
      }

      if (this.state !== 'GAME') return;

      if (this.shootCooldown > 0) this.shootCooldown--;

      // Controls
      if (this.keys.left && this.px > 1) this.px--;
      if (this.keys.right && this.px < 36) this.px++;
      if (this.keys.up && this.py > 16) this.py--;
      if (this.keys.down && this.py < 23) this.py++;
      if (this.keys.fire && this.shootCooldown === 0) {
        this.shoot();
      }

      // Stars
      for (let s of this.stars) {
        s.y += s.speed * 0.4;
        if (s.y >= 24) {
          s.y = 1;
          s.x = Math.floor(Math.random() * 38) + 1;
        }
      }

      // Formation sway
      if (this.tick % 12 === 0) {
        this.formationSway += this.formationDir;
        if (this.formationSway >= 3 || this.formationSway <= -1) {
          this.formationDir = -this.formationDir;
        }
      }

      // Dive trigger
      if (this.tick % 45 === 0) {
        const inFormation = this.enemies.filter(e => e.state === 0);
        if (inFormation.length > 0) {
          const candidate = inFormation[Math.floor(Math.random() * inFormation.length)];
          candidate.state = 1; // Diving
        }
      }

      // Update Enemies
      for (let e of this.enemies) {
        if (e.state === 0) {
          e.x = e.origX + this.formationSway;
          e.y = e.origY;
        } else if (e.state === 1) {
          e.timer++;
          e.y += 0.35;
          if (e.x < this.px) e.x += 0.2;
          else if (e.x > this.px) e.x -= 0.2;

          // Alien shooting
          if (e.timer === 20 && Math.random() < 0.6) {
            this.eBullets.push({ x: Math.floor(e.x + 1), y: Math.floor(e.y + 1) });
          }

          if (e.y >= 24) {
            e.y = 2;
            e.state = 0;
          }
        }
      }

      // Update Player Bullets
      for (let i = this.pBullets.length - 1; i >= 0; i--) {
        const b = this.pBullets[i];
        b.y += b.vy;
        if (b.y < 1) {
          this.pBullets.splice(i, 1);
          continue;
        }

        // Hit enemy
        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const enemy = this.enemies[ei];
          if (Math.abs(b.y - enemy.y) < 1 && Math.abs(b.x - (enemy.x + 1)) <= 1.5) {
            enemy.hp--;
            this.pBullets.splice(i, 1);
            if (enemy.hp <= 0) {
              this.sid.playExplode();
              this.score += (enemy.type === 2) ? 150 : ((enemy.type === 1) ? 80 : 50);
              this.checkDrop(enemy.x + 1, enemy.y);
              this.enemies.splice(ei, 1);
            } else {
              this.sid.playLaser();
            }
            break;
          }
        }
      }

      // Update Missiles
      for (let i = this.missiles.length - 1; i >= 0; i--) {
        const m = this.missiles[i];
        if (m.type === 'HOMING') {
          let target = null;
          let minDist = 999;
          for (let e of this.enemies) {
            const dist = Math.hypot(e.x - m.x, e.y - m.y);
            if (dist < minDist) {
              minDist = dist;
              target = e;
            }
          }
          if (target) {
            if (m.x < target.x + 1) m.x += 0.25;
            else if (m.x > target.x + 1) m.x -= 0.25;
          }
          m.y -= 0.6;
        } else {
          m.x += m.vx || 0;
          m.y += m.vy || -1.0;
        }

        if (m.y < 1) {
          this.missiles.splice(i, 1);
          continue;
        }

        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const enemy = this.enemies[ei];
          if (Math.abs(m.y - enemy.y) < 1 && Math.abs(m.x - (enemy.x + 1)) <= 1.5) {
            this.sid.playExplode();
            this.score += 150;
            this.checkDrop(enemy.x + 1, enemy.y);
            this.enemies.splice(ei, 1);
            this.missiles.splice(i, 1);
            break;
          }
        }
      }

      // Update Enemy Bullets
      for (let i = this.eBullets.length - 1; i >= 0; i--) {
        const eb = this.eBullets[i];
        eb.y += 0.4;
        if (eb.y >= 24) {
          this.eBullets.splice(i, 1);
          continue;
        }

        if (Math.abs(eb.y - this.py) < 1 && Math.abs(eb.x - (this.px + 1)) <= 1.5) {
          this.eBullets.splice(i, 1);
          if (this.shield > 0) {
            this.shield--;
            this.sid.playShield();
          } else {
            this.sid.playExplode();
            this.lives--;
            this.weapon = 'NORMAL';
            if (this.lives === 0) {
              this.state = 'READY';
            }
          }
        }
      }

      // Update Drops
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        d.y += 0.25;
        d.wobble += 0.08;
        d.x += Math.sin(d.wobble) * 0.15;

        if (d.y >= 24) {
          this.drops.splice(i, 1);
          continue;
        }

        if (Math.abs(d.y - this.py) < 1 && Math.abs(d.x - (this.px + 1)) <= 2) {
          this.sid.playPowerup();
          if (d.type === 'S') this.shield = 2;
          else if (d.type === 'R') this.weapon = 'RAPID';
          else if (d.type === 'M') this.weapon = 'MISSILES';
          else if (d.type === 'H') this.weapon = 'HYPER';
          this.score += 200;
          this.drops.splice(i, 1);
        }
      }

      // Wave cleared
      if (this.enemies.length === 0) {
        this.initFormation();
        this.sid.playPowerup();
      }
    }

    draw() {
      // Clear canvas with border color
      this.ctx.fillStyle = C64_PALETTE[this.borderColor];
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Inner 320x200 screen
      this.ctx.fillStyle = C64_PALETTE[this.bgColor];
      this.ctx.fillRect(BORDER_X, BORDER_Y, COLS * CHAR_W, ROWS * CHAR_H);

      if (this.state === 'BOOT') {
        this.drawBootScreen();
      } else if (this.state === 'READY') {
        this.drawTitleScreen();
      } else if (this.state === 'GAME') {
        this.drawGameScreen();
      }
    }

    drawBootScreen() {
      const col = 14; // Light Blue text
      this.drawC64Text(1, 1, '**** COMMODORE 64 BASIC V2 ****', col);
      this.drawC64Text(1, 3, '64K RAM SYSTEM  38911 BASIC BYTES FREE', col);
      this.drawC64Text(1, 5, 'READY.', col);

      if (this.bootTimer > 40) {
        this.drawC64Text(1, 7, 'LOAD "GALAXY",8,1', col);
      }
      if (this.bootTimer > 80) {
        this.drawC64Text(1, 9, 'SEARCHING FOR GALAXY', col);
      }
      if (this.bootTimer > 120) {
        this.drawC64Text(1, 10, 'LOADING', col);
      }
      if (this.bootTimer > 150) {
        this.drawC64Text(1, 12, 'READY.', col);
        this.drawC64Text(1, 14, 'RUN', col);
      }
      // Blinking cursor
      if (Math.floor(this.tick / 16) % 2 === 0) {
        const cursorY = (this.bootTimer < 40) ? 6 : ((this.bootTimer < 80) ? 8 : 15);
        this.drawC64Block(1, cursorY, 14);
      }
    }

    drawTitleScreen() {
      this.drawC64Text(6, 2, '**** COMMODORE 64 GALAXY ****', 7);
      this.drawC64Text(12, 4, '1985 RETRO ARCADE', 3);

      this.drawC64Text(10, 7, '- POINT TABLE -', 1);
      this.drawC64Text(12, 9, '<o> BEE        50 PTS', 7);
      this.drawC64Text(12, 11, '[V] BUTTERFLY  80 PTS', 10);
      this.drawC64Text(12, 13, '(W) BOSS      150 PTS', 13);

      this.drawC64Text(7, 16, 'CONTROLS: WASD / JOYSTICK 2', 3);
      this.drawC64Text(9, 18, 'FIRE: SPACE / JOY BUTTON', 3);

      if (Math.floor(this.tick / 20) % 2 === 0) {
        this.drawC64Text(5, 22, 'PRESS SPACE OR FIRE TO START', 1);
      }
    }

    drawGameScreen() {
      // 1. Stars
      for (let s of this.stars) {
        this.drawC64Char(Math.floor(s.x), Math.floor(s.y), s.ch, s.color);
      }

      // 2. HUD
      const sScore = `1UP:${('00000' + this.score).slice(-5)}`;
      this.drawC64Text(1, 0, sScore, 1);
      this.drawC64Text(15, 0, 'HIGH:10000', 7);
      this.drawC64Text(32, 0, `L:${this.lives}`, 13);

      // Weapon & Shield
      const wpnNames = { NORMAL: 'LASER', RAPID: 'RAPID', MISSILES: 'MISSILE', HYPER: 'HYPER' };
      const wpnColors = { NORMAL: 3, RAPID: 7, MISSILES: 10, HYPER: 4 };
      this.drawC64Text(1, 1, `WPN:${wpnNames[this.weapon]}`, wpnColors[this.weapon]);

      if (this.shield > 0) {
        const sTxt = 'SHIELD:' + '[]'.repeat(this.shield);
        this.drawC64Text(28, 1, sTxt, 3);
      }

      // 3. Enemies
      for (let e of this.enemies) {
        const ex = Math.floor(e.x);
        const ey = Math.floor(e.y);
        if (e.type === 2) {
          this.drawC64Char(ex, ey, '(', 13);
          this.drawC64Char(ex + 1, ey, 'W', 7);
          this.drawC64Char(ex + 2, ey, ')', 13);
        } else if (e.type === 1) {
          this.drawC64Char(ex, ey, '[', 2);
          this.drawC64Char(ex + 1, ey, 'V', 10);
          this.drawC64Char(ex + 2, ey, ']', 2);
        } else {
          this.drawC64Char(ex, ey, '<', 7);
          this.drawC64Char(ex + 1, ey, 'o', 3);
          this.drawC64Char(ex + 2, ey, '>', 7);
        }
      }

      // 4. Player Bullets
      for (let b of this.pBullets) {
        this.drawC64Char(Math.floor(b.x), Math.floor(b.y), '|', 7);
      }

      // 5. Missiles
      for (let m of this.missiles) {
        this.drawC64Char(Math.floor(m.x), Math.floor(m.y), '^', (m.type === 'HYPER') ? 4 : 10);
      }

      // 6. Enemy Bullets
      for (let eb of this.eBullets) {
        this.drawC64Char(Math.floor(eb.x), Math.floor(eb.y), '*', 10);
      }

      // 7. Drops
      for (let d of this.drops) {
        this.drawC64Char(Math.floor(d.x), Math.floor(d.y), d.type, d.color);
      }

      // 8. Player Ship
      if (this.shield > 0) {
        this.drawC64Char(this.px - 1, this.py, '(', 14);
        this.drawC64Char(this.px + 3, this.py, ')', 14);
      }
      this.drawC64Char(this.px, this.py, '<', 2);
      this.drawC64Char(this.px + 1, this.py, '^', 1);
      this.drawC64Char(this.px + 2, this.py, '>', 2);
    }

    drawC64Char(col, row, ch, colorIndex) {
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
      const x = BORDER_X + col * CHAR_W;
      const y = BORDER_Y + row * CHAR_H;

      this.ctx.fillStyle = C64_PALETTE[colorIndex];
      this.ctx.font = '8px "Press Start 2P", monospace';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(ch, x, y);
    }

    drawC64Text(col, row, str, colorIndex) {
      for (let i = 0; i < str.length; i++) {
        this.drawC64Char(col + i, row, str[i], colorIndex);
      }
    }

    drawC64Block(col, row, colorIndex) {
      const x = BORDER_X + col * CHAR_W;
      const y = BORDER_Y + row * CHAR_H;
      this.ctx.fillStyle = C64_PALETTE[colorIndex];
      this.ctx.fillRect(x, y, CHAR_W, CHAR_H);
    }
  }

  // Init
  function init() {
    const canvas = document.getElementById('c64Canvas');
    if (!canvas) return;
    const game = new C64Galaxy(canvas);

    function loop() {
      requestAnimationFrame(loop);
      game.update();
      game.draw();
    }
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
