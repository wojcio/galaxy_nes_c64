/**
 * GALAXY - 8-Bit Nintendo NES Retro Arcade Game
 * Standalone Self-Contained Engine (Zero CORS dependencies, runs directly on file:// and http://)
 */

(function () {
  'use strict';

  // --- NES PALETTE ---
  const NES_PALETTE = {
    '.': 'transparent',
    '0': '#000000', // Black
    'W': '#FCFCFC', // White
    'R': '#F83800', // Bright Red
    'r': '#880000', // Dark Red
    'B': '#0058F8', // Deep Blue
    'C': '#3CBCFC', // Cyan / Light Blue
    'Y': '#F8B800', // Gold / Yellow
    'y': '#FCFC00', // Bright Yellow
    'G': '#00A800', // Green
    'g': '#58F858', // Light Green
    'O': '#F87800', // Orange
    'M': '#F85898', // Magenta / Pink
    'P': '#9838F0', // Purple
    'D': '#7C7C7C', // Medium Gray
    'd': '#444444', // Dark Gray
  };

  // --- 16x16 PIXEL SPRITES ---
  const SPRITE_DATA = {
    player: [
      [
        ".......WW.......",
        ".......WW.......",
        "......RWWF......",
        "......RWWF......",
        ".....RRWWFF.....",
        "....RRRWWFFF....",
        "....RRRWWFFF....",
        "...RRRCCWFFFF...",
        "...RRRCCWFFFF...",
        "..RRRCCCCFFFFF..",
        "..RR.CCCC.FFFF..",
        ".RR..CCCC..FFF..",
        "RR...WWWW...FFFF",
        "RR...W..W...FFFF",
        "......YY........",
        "......OO........"
      ].map(r => r.replace(/F/g, 'R')),
      [
        ".......WW.......",
        ".......WW.......",
        "......RRRR......",
        "......RRRR......",
        ".....RRWWRR.....",
        "....RRRWWFFF....",
        "....RRRWWFFF....",
        "...RRRCCWFFFF...",
        "...RRRCCWFFFF...",
        "..RRRCCCCFFFFF..",
        "..RR.CCCC.FFFF..",
        ".RR..CCCC..FFF..",
        "RR...WWWW...FFFF",
        "RR...W..W...FFFF",
        ".....YYYY.......",
        "......RR........"
      ].map(r => r.replace(/F/g, 'R'))
    ],

    bee: [
      [
        "....YY....YY....",
        "...YYYY..YYYY...",
        "...BBBB..BBBB...",
        "..BBCCCCCCCBBB..",
        "..BBCCCCCCCBBB..",
        "...BBBBWWBBBB...",
        "...YYYYRRYYYY...",
        "..YYYYYYYYYYYY..",
        "..YYYY0000YYYY..",
        ".YYYYY0YY0YYYYY.",
        ".YYYYY0YY0YYYYY.",
        "..YYYY0000YYYY..",
        "...YYYRRRRYYY...",
        "....YY....YY....",
        ".....Y....Y.....",
        "................"
      ],
      [
        "..YY........YY..",
        "..YYYY....YYYY..",
        "...BBBB..BBBB...",
        "...BCCCCCCCB....",
        "..BBCCCCCCCBB...",
        "..BBBBBWWBBBBB..",
        "...YYYYRRYYYY...",
        "...YYYYYYYYYY...",
        "..YYYY0000YYYY..",
        "..YYYY0YY0YYYY..",
        "...YYY0YY0YYY...",
        "...YYY0000YYY...",
        "....YYRRRRYY....",
        ".....YY..YY.....",
        ".....YY..YY.....",
        "................"
      ]
    ],

    butterfly: [
      [
        "....RR....RR....",
        "...RRRR..RRRR...",
        "...RROO..OORR...",
        "..RROOOOOOOORR..",
        "..RROOWWWWOORR..",
        "..RROOWWWWOORR..",
        "...RROOOOOORR...",
        "...YYYYYYYYYY...",
        "..YYYY0000YYYY..",
        ".YYYYY0YY0YYYYY.",
        ".YYYYY0YY0YYYYY.",
        "..YYYY0000YYYY..",
        "...YYYRRRRYYY...",
        "....YYRRRRYY....",
        ".....R....R.....",
        "................"
      ],
      [
        "..RR........RR..",
        "..RRRR....RRRR..",
        "...RROO..OORR...",
        "...ROOOOOOOOR...",
        "..RROOWWWWOORR..",
        "..RROOWWWWOORR..",
        "...RROOOOOORR...",
        "....YYYYYYYY....",
        "...YYY0000YYY...",
        "..YYYY0YY0YYYY..",
        "..YYYY0YY0YYYY..",
        "...YYY0000YYY...",
        "....YYRRRRYY....",
        "....RR....RR....",
        ".....R....R.....",
        "................"
      ]
    ],

    bossGreen: [
      [
        "....GG....GG....",
        "...GGGG..GGGG...",
        "..GGGGGGGGGGGG..",
        "..GGCCGGGGCCGG..",
        ".GGCCCCGGCCCCGG.",
        ".GGCCCCGGCCCCGG.",
        ".GGGGCCGGCCGGGG.",
        "..GGGGYYYYGGGG..",
        "...GGYYYYYYGG...",
        "..GGGG0000GGGG..",
        ".GGGGG0GG0GGGGG.",
        ".GGGGG0000GGGGG.",
        "..GGGGRRRRGGGG..",
        "...GGGRRRRGGG...",
        "....GG....GG....",
        ".....G....G....."
      ],
      [
        "..GG........GG..",
        "..GGGG....GGGG..",
        "...GGGGGGGGGG...",
        "..GGCCGGGGCCGG..",
        ".GGCCCCGGCCCCGG.",
        ".GGCCCCGGCCCCGG.",
        "..GGGCCGGCCGGG..",
        "..GGGGYYYYGGGG..",
        "...GGYYYYYYGG...",
        "...GGG0000GGG...",
        "..GGGG0GG0GGGG..",
        "..GGGG0000GGGG..",
        "...GGGRRRRGGG...",
        "....GGRRRRGG....",
        "....GG....GG....",
        "................"
      ]
    ],

    bossBlue: [
      [
        "....BB....BB....",
        "...BBBB..BBBB...",
        "..BBBBBBBBBBBB..",
        "..BBCCBBBBCCBB..",
        ".BBCCCCBBCCCCBB.",
        ".BBCCCCBBCCCCBB.",
        ".BBBBCCBBCCBBBB.",
        "..BBBBYYYYBBBB..",
        "...BBYYYYYYBB...",
        "..BBBB0000BBBB..",
        ".BBBBB0BB0BBBBB.",
        ".BBBBB0000BBBBB.",
        "..BBBBRRRRBBBB..",
        "...BBBRRRRBBB...",
        "....BB....BB....",
        ".....B....B....."
      ],
      [
        "..BB........BB..",
        "..BBBB....BBBB..",
        "...BBBBBBBBBB...",
        "..BBCCBBBBCCBB..",
        ".BBCCCCBBCCCCBB.",
        ".BBCCCCBBCCCCBB.",
        "..BBBCCBBCCBBB..",
        "..BBBBYYYYBBBB..",
        "...BBYYYYYYBB...",
        "...BBB0000BBB...",
        "..BBBB0BB0BBBB..",
        "..BBBB0000BBBB..",
        "...BBBRRRRBBB...",
        "....BBRRRRBB....",
        "....BB....BB....",
        "................"
      ]
    ],

    explosion: [
      [
        "................",
        "................",
        ".......YY.......",
        "......YYYY......",
        "......YYYY......",
        ".....YYYYYY.....",
        ".....YYRRYY.....",
        "....YYRRRRYY....",
        "....YYRRRRYY....",
        ".....YYRRYY.....",
        ".....YYYYYY.....",
        "......YYYY......",
        "......YYYY......",
        ".......YY.......",
        "................",
        "................"
      ],
      [
        ".......WW.......",
        "....YY.WW.YY....",
        "...YYYYWWYYYY...",
        "..YYYRRWWRRYYY..",
        "...YYRRWWRRYY...",
        "..YRRRRWWRRRRY..",
        ".WWRRRR..RRRRWW.",
        ".WWWW......WWWW.",
        ".WWWW......WWWW.",
        ".WWRRRR..RRRRWW.",
        "..YRRRRWWRRRRY..",
        "...YYRRWWRRYY...",
        "..YYYRRWWRRYYY..",
        "...YYYYWWYYYY...",
        "....YY.WW.YY....",
        ".......WW.......",
      ],
      [
        "...W........W...",
        ".W...R.WW.R...W.",
        "...R..RRRR..R...",
        "....RR....RR....",
        "..R...YY..YY..R.",
        ".R...YYYYYYYY..R",
        ".W..YY....YYYY.W",
        "W...Y......Y...W",
        "W...Y......Y...W",
        ".W..YY....YYYY.W",
        ".R...YYYYYYYY..R",
        "..R...YY..YY..R.",
        "....RR....RR....",
        "...R..RRRR..R...",
        ".W...R.WW.R...W.",
        "...W........W..."
      ],
      [
        ".W............W.",
        "...Y........Y...",
        ".....R....R.....",
        "..R..........R..",
        "....W......W....",
        "......Y..Y......",
        ".Y............Y.",
        "......R..R......",
        "......R..R......",
        ".Y............Y.",
        "......Y..Y......",
        "....W......W....",
        "..R..........R..",
        ".....R....R.....",
        "...Y........Y...",
        ".W............W."
      ],
      [
        "................",
        ".D............D.",
        ".....d....d.....",
        "................",
        "...d........d...",
        "................",
        "................",
        "....d......d....",
        "....d......d....",
        "................",
        "................",
        "...d........d...",
        "................",
        ".....d....d.....",
        ".D............D.",
        "................"
      ]
    ],

    flag1: [
      "....RRRRRR......",
      "....RRRRRR......",
      "....RRRRRR......",
      "....WWWWWW......",
      "....WWWWWW......",
      "....WWWWWW......",
      "....WW..........",
      "....WW..........",
      "....WW..........",
      "....WW..........",
      "....WW..........",
      "....WW..........",
      "....WW..........",
      "....WW..........",
      "....WW..........",
      "................"
    ]
  };

  function createOffscreenCanvas(width, height) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  class SpriteCache {
    constructor() {
      this.cache = new Map();
      this.init();
    }

    init() {
      for (const [key, val] of Object.entries(SPRITE_DATA)) {
        if (Array.isArray(val) && Array.isArray(val[0])) {
          this.cache.set(key, val.map(frame => this.renderMatrix(frame)));
        } else if (Array.isArray(val)) {
          this.cache.set(key, [this.renderMatrix(val)]);
        }
      }
    }

    renderMatrix(matrix, pixelSize = 1) {
      const height = matrix.length;
      const width = matrix[0].length;
      const { canvas, ctx } = createOffscreenCanvas(width * pixelSize, height * pixelSize);

      for (let y = 0; y < height; y++) {
        const row = matrix[y];
        for (let x = 0; x < width; x++) {
          const char = row[x];
          const color = NES_PALETTE[char] || 'transparent';
          if (color !== 'transparent') {
            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }
      return canvas;
    }

    get(name, frame = 0) {
      const list = this.cache.get(name);
      if (!list || list.length === 0) return null;
      return list[frame % list.length];
    }
  }

  // --- NES AUDIO SYNTHESIZER ---
  class NesAudio {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.noiseBuffer = null;
      this.isMuted = false;
      this.initialized = false;
    }

    init() {
      if (this.initialized) {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        return;
      }

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.25;
        this.masterGain.connect(this.ctx.destination);

        this.createNesNoiseBuffer();
        this.initialized = true;
      } catch (e) {
        console.warn('Web Audio API not supported or blocked:', e);
      }
    }

    createNesNoiseBuffer() {
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      let shiftRegister = 1;
      let period = Math.floor(sampleRate / 1789773 * 1000) || 12;
      let counter = 0;
      let sample = 0;

      for (let i = 0; i < bufferSize; i++) {
        counter++;
        if (counter >= period) {
          counter = 0;
          const feedback = (shiftRegister & 1) ^ ((shiftRegister >> 1) & 1);
          shiftRegister = (shiftRegister >> 1) | (feedback << 14);
          sample = (shiftRegister & 1) ? 1 : -1;
        }
        data[i] = sample * 0.7;
      }
      this.noiseBuffer = buffer;
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
      }
      return this.isMuted;
    }

    createPulseWave(duty = 0.5) {
      if (!this.ctx) return null;
      const n = 64;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      for (let i = 1; i < n; i++) {
        imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
      }
      return this.ctx.createPeriodicWave(real, imag);
    }

    playShoot() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const pulseWave = this.createPulseWave(0.25);
      if (pulseWave) osc.setPeriodicWave(pulseWave);
      else osc.type = 'square';

      osc.frequency.setValueAtTime(920, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.12);
    }

    playDive() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(540, t + 0.1);
      osc.frequency.linearRampToValueAtTime(260, t + 0.25);
      osc.frequency.linearRampToValueAtTime(420, t + 0.38);
      osc.frequency.linearRampToValueAtTime(180, t + 0.5);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.5);
    }

    playEnemyShoot() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(120, t + 0.15);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.15);
    }

    playExplosion(isBoss = false) {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const duration = isBoss ? 0.45 : 0.25;

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isBoss ? 1600 : 2800, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isBoss ? 0.6 : 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + duration);
      }

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isBoss ? 120 : 180, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + duration);

      oscGain.gain.setValueAtTime(0.4, t);
      oscGain.gain.linearRampToValueAtTime(0.01, t + duration);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration);
    }

    playPlayerDeath() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const duration = 1.2;

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3500, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + duration);
      }

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'square';

      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(330, t + 0.15);
      osc.frequency.setValueAtTime(220, t + 0.35);
      osc.frequency.setValueAtTime(165, t + 0.55);
      osc.frequency.setValueAtTime(110, t + 0.75);
      osc.frequency.exponentialRampToValueAtTime(40, t + duration);

      oscGain.gain.setValueAtTime(0.4, t);
      oscGain.gain.linearRampToValueAtTime(0.01, t + duration);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration);
    }

    playStartJingle() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime + 0.05;

      const N = {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
        C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
        C6: 1046.50
      };

      const melody = [
        [N.G4, 0.09, 0.00], [N.C5, 0.09, 0.10], [N.E5, 0.09, 0.20], [N.G5, 0.18, 0.30],
        [N.E5, 0.09, 0.50], [N.G5, 0.28, 0.60], [N.A4, 0.09, 0.95], [N.D5, 0.09, 1.05],
        [N.F5, 0.09, 1.15], [N.A5, 0.18, 1.25], [N.F5, 0.09, 1.45], [N.A5, 0.28, 1.55],
        [N.B4, 0.09, 1.90], [N.D5, 0.09, 2.00], [N.G5, 0.09, 2.10], [N.B5, 0.18, 2.20],
        [N.C6, 0.45, 2.40]
      ];

      melody.forEach(([freq, dur, offset]) => {
        const start = t + offset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + dur);
      });

      const bass = [
        [N.C4 / 2, 0.45, 0.00], [N.C4 / 2, 0.45, 0.50],
        [N.D4 / 2, 0.45, 0.95], [N.D4 / 2, 0.45, 1.45],
        [N.G4 / 2, 0.45, 1.90], [N.C4 / 2, 0.55, 2.40]
      ];

      bass.forEach(([freq, dur, offset]) => {
        const start = t + offset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.linearRampToValueAtTime(0.01, start + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + dur);
      });
    }

    playStageClear() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime + 0.05;

      const notes = [
        [523.25, 0.10, 0.0],
        [659.25, 0.10, 0.12],
        [783.99, 0.10, 0.24],
        [1046.50, 0.35, 0.36]
      ];

      notes.forEach(([freq, dur, offset]) => {
        const start = t + offset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + dur);
      });
    }

    playHit() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  // --- STARFIELD ---
  class Starfield {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.stars = [];
      this.colors = ['#FCFCFC', '#F83800', '#3CBCFC', '#FCB800', '#F87800', '#58F858'];
      this.speedMultiplier = 1.0;
      this.initStars(55);
    }

    initStars(count) {
      this.stars = [];
      for (let i = 0; i < count; i++) {
        const speedTier = Math.random();
        let speed, size;
        if (speedTier < 0.6) {
          speed = 0.5 + Math.random() * 0.5;
          size = 1;
        } else if (speedTier < 0.88) {
          speed = 1.2 + Math.random() * 0.8;
          size = 1.5;
        } else {
          speed = 2.4 + Math.random() * 1.0;
          size = 2;
        }

        this.stars.push({
          x: Math.floor(Math.random() * this.width),
          y: Math.floor(Math.random() * this.height),
          baseSpeed: speed,
          size: Math.floor(size),
          colorIndex: Math.floor(Math.random() * this.colors.length),
          twinkleTimer: Math.random() * 30,
          twinkleRate: 15 + Math.random() * 20
        });
      }
    }

    update() {
      for (let s of this.stars) {
        s.y += s.baseSpeed * this.speedMultiplier;
        if (s.y >= this.height) {
          s.y = 0;
          s.x = Math.floor(Math.random() * this.width);
        }

        s.twinkleTimer++;
        if (s.twinkleTimer >= s.twinkleRate) {
          s.twinkleTimer = 0;
          s.colorIndex = (s.colorIndex + 1) % this.colors.length;
        }
      }
    }

    draw(ctx) {
      for (let s of this.stars) {
        ctx.fillStyle = this.colors[s.colorIndex];
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
      }
    }
  }

  // --- GAME CONSTANTS & ENTITY DEFINITIONS ---
  const CANVAS_WIDTH = 288;
  const CANVAS_HEIGHT = 384;

  const ENEMY_TYPES = {
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

  // --- MAIN GAME CLASS ---
  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      this.sprites = new SpriteCache();
      this.audio = new NesAudio();
      this.starfield = new Starfield(CANVAS_WIDTH, CANVAS_HEIGHT);

      this.highScore = parseInt(localStorage.getItem('galaxy_highscore') || '10000', 10);
      this.score = 0;
      this.lives = 3;
      this.stage = 1;

      // Start in PLAYING mode immediately so the user sees everything moving right away!
      this.state = 'STAGE_INTRO';
      this.stateTimer = 0;

      this.keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        space: false,
        spaceJustPressed: false
      };

      this.player = null;
      this.playerBullets = [];
      this.enemies = [];
      this.enemyBullets = [];
      this.explosions = [];
      this.floatingTexts = [];

      this.formationX = 0;
      this.formationDir = 1;
      this.formationTimer = 0;

      this.diveTimer = 0;
      this.diveInterval = 110;

      this.tick = 0;
      this.shootCooldown = 0;

      this.initInput();
      this.resetPlayer();
      this.startStage(1);
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

        // Initialize audio on first keypress
        this.audio.init();

        if (this.state === 'GAME_OVER' && (key === ' ' || e.code === 'Space') && this.stateTimer > 60) {
          this.startNewGame();
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

      this.canvas.addEventListener('click', () => {
        this.audio.init();
        if (this.state === 'GAME_OVER' && this.stateTimer > 60) {
          this.startNewGame();
        }
      });
    }

    resetPlayer() {
      this.player = {
        x: CANVAS_WIDTH / 2 - 8,
        y: CANVAS_HEIGHT - 38,
        width: 16,
        height: 16,
        speed: 2.5,
        invulnerableTimer: 90,
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
      this.diveInterval = Math.max(45, 120 - (this.stage * 10));
      this.spawnFormation();
      this.audio.playStartJingle();
    }

    spawnFormation() {
      this.enemies = [];
      const colSpacing = 24;
      const rowSpacing = 20;
      const gridStartX = 56;
      const gridStartY = 50;

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
        state: 'ENTERING',
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

      const inFormation = this.enemies.filter(e => e.state === 'IN_FORMATION');
      if (inFormation.length === 0) return;

      const leaders = inFormation.filter(e => e.type === ENEMY_TYPES.BOSS || e.type === ENEMY_TYPES.BUTTERFLY);
      const candidate = leaders.length > 0 && Math.random() < 0.65
        ? leaders[Math.floor(Math.random() * leaders.length)]
        : inFormation[Math.floor(Math.random() * inFormation.length)];

      if (!candidate) return;

      this.startEnemyDive(candidate);
      this.audio.playDive();

      if (candidate.type === ENEMY_TYPES.BOSS) {
        const availableEscorts = inFormation.filter(e => e.id !== candidate.id && e.type !== ENEMY_TYPES.BOSS);
        if (availableEscorts.length > 0) {
          this.startEnemyDive(availableEscorts[0], candidate, -18);
          if (availableEscorts.length > 1 && Math.random() < 0.7) {
            this.startEnemyDive(availableEscorts[1], candidate, 18);
          }
        }
      }
    }

    startEnemyDive(enemy, leader = null, offsetX = 0) {
      enemy.state = 'DIVING';
      enemy.diveTimer = 0;
      enemy.diveEscort = leader;
      enemy.escortOffset = offsetX;

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const angle = Math.atan2(dy, dx);

      const baseSpeed = 2.2 + Math.min(1.8, this.stage * 0.3);
      enemy.diveVx = Math.cos(angle) * baseSpeed;
      enemy.diveVy = Math.max(1.8, Math.sin(angle) * baseSpeed);
    }

    shootPlayerLaser() {
      if (!this.player.alive) return;
      if (this.playerBullets.length >= 4) return;

      const bulletY = this.player.y - 4;
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
      const speed = 2.5 + Math.min(1.5, this.stage * 0.2);

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

    update() {
      this.tick++;
      this.starfield.update();

      if (this.shootCooldown > 0) {
        this.shootCooldown--;
      }

      if (this.state === 'PLAYING') {
        if (this.keys.spaceJustPressed || (this.keys.space && this.shootCooldown === 0)) {
          this.shootPlayerLaser();
          this.shootCooldown = 12;
        }
      }
      this.keys.spaceJustPressed = false;

      switch (this.state) {
        case 'STAGE_INTRO':
          this.stateTimer++;
          this.updatePlayer();
          this.updateFormationIntro();
          if (this.stateTimer > 120) {
            this.state = 'PLAYING';
          }
          break;

        case 'PLAYING':
          this.updatePlayer();
          this.updateEnemies();
          this.updateProjectiles();
          this.checkCollisions();

          if (this.enemies.length === 0) {
            this.state = 'STAGE_CLEAR';
            this.stateTimer = 0;
            this.audio.playStageClear();
          }
          break;

        case 'PLAYER_DEAD':
          this.stateTimer++;
          this.updateProjectiles();
          this.updateEnemies(false);
          if (this.stateTimer > 90) {
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
          this.updatePlayer();
          this.updateProjectiles();
          if (this.stateTimer > 110) {
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

      if (this.keys.a) this.player.x -= this.player.speed;
      if (this.keys.d) this.player.x += this.player.speed;
      if (this.keys.w) this.player.y -= this.player.speed;
      if (this.keys.s) this.player.y += this.player.speed;

      const minX = 8;
      const maxX = CANVAS_WIDTH - this.player.width - 8;
      const minY = 200;
      const maxY = CANVAS_HEIGHT - this.player.height - 12;

      this.player.x = Math.max(minX, Math.min(maxX, this.player.x));
      this.player.y = Math.max(minY, Math.min(maxY, this.player.y));
    }

    updateFormationIntro() {
      for (let enemy of this.enemies) {
        if (enemy.state === 'ENTERING') {
          enemy.pathProgress += enemy.pathSpeed;
          if (enemy.pathProgress >= 1.0) {
            enemy.x = enemy.targetX;
            enemy.y = enemy.targetY;
            enemy.state = 'IN_FORMATION';
          } else {
            const p = enemy.pathProgress;
            const startX = (enemy.id % 2 === 0) ? -20 : CANVAS_WIDTH + 20;
            const startY = 100;
            const controlX = CANVAS_WIDTH / 2;
            const controlY = 220;

            const inv = 1 - p;
            enemy.x = inv * inv * startX + 2 * inv * p * controlX + p * p * enemy.targetX;
            enemy.y = inv * inv * startY + 2 * inv * p * controlY + p * p * enemy.targetY;
          }
        }
      }
    }

    updateEnemies(allowDives = true) {
      this.formationTimer += 0.035;
      this.formationX = Math.sin(this.formationTimer) * 14;

      if (allowDives && this.state === 'PLAYING') {
        this.diveTimer++;
        if (this.diveTimer >= this.diveInterval) {
          this.diveTimer = 0;
          this.triggerDiveAttack();
        }
      }

      for (let enemy of this.enemies) {
        if (this.tick % 16 === 0) {
          enemy.animFrame = 1 - enemy.animFrame;
        }

        if (enemy.state === 'IN_FORMATION') {
          enemy.x = enemy.targetX + this.formationX;
          enemy.y = enemy.targetY;
        } else if (enemy.state === 'DIVING') {
          enemy.diveTimer++;

          if (enemy.diveEscort) {
            if (!this.enemies.includes(enemy.diveEscort) || enemy.diveEscort.state !== 'DIVING') {
              enemy.diveEscort = null;
              enemy.diveVx = (Math.random() - 0.5) * 2;
              enemy.diveVy = 2.4;
            } else {
              enemy.x = enemy.diveEscort.x + enemy.escortOffset;
              enemy.y = enemy.diveEscort.y + 4;
            }
          } else {
            enemy.x += enemy.diveVx + Math.sin(enemy.diveTimer * 0.1) * 1.5;
            enemy.y += enemy.diveVy;

            if (enemy.diveTimer === 35 || enemy.diveTimer === 65) {
              if (Math.random() < 0.75 + this.stage * 0.05) {
                this.shootEnemyBullet(enemy);
              }
            }
          }

          if (enemy.y > CANVAS_HEIGHT + 20) {
            enemy.y = -20;
            enemy.x = enemy.targetX + this.formationX;
            enemy.state = 'RETURNING';
          }
        } else if (enemy.state === 'RETURNING') {
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
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const b = this.playerBullets[i];
        b.y -= b.speed;
        if (b.y < -10) {
          this.playerBullets.splice(i, 1);
        }
      }

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
              const isDiving = enemy.state === 'DIVING' || enemy.state === 'RETURNING';
              const pts = isDiving ? enemy.type.pointsDiving : enemy.type.pointsFormation;
              this.score += pts;
              this.addFloatingScore(enemy.x, enemy.y, `+${pts}`);
              this.addExplosion(enemy.x, enemy.y, enemy.type === ENEMY_TYPES.BOSS);
              this.enemies.splice(ei, 1);
            } else {
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

    draw() {
      this.ctx.fillStyle = NES_PALETTE['0'];
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Starfield
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
          if (enemy.state === 'DIVING') {
            const angle = Math.atan2(enemy.diveVy, enemy.diveVx) - Math.PI / 2;
            this.ctx.rotate(angle);
          }
          this.ctx.drawImage(spr, -enemy.width / 2, -enemy.height / 2);
          this.ctx.restore();
        }
      }

      // 4. Enemy Bullets
      for (let eb of this.enemyBullets) {
        this.ctx.fillStyle = (this.tick % 6 < 3) ? NES_PALETTE['R'] : NES_PALETTE['Y'];
        this.ctx.fillRect(Math.floor(eb.x), Math.floor(eb.y), eb.width, eb.height);
        this.ctx.fillStyle = NES_PALETTE['W'];
        this.ctx.fillRect(Math.floor(eb.x + 1), Math.floor(eb.y + 1), 1, eb.height - 2);
      }

      // 5. Player Bullets
      for (let b of this.playerBullets) {
        this.ctx.fillStyle = NES_PALETTE['C'];
        this.ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.width, b.height);
        this.ctx.fillStyle = NES_PALETTE['W'];
        this.ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.width, 2);
      }

      // 6. Player Ship
      if (this.player.alive) {
        const visible = (this.player.invulnerableTimer === 0) || (Math.floor(this.player.invulnerableTimer / 4) % 2 === 0);
        if (visible) {
          const flameFrame = (this.tick % 8 < 4) ? 0 : 1;
          const spr = this.sprites.get('player', flameFrame);
          if (spr) {
            this.ctx.drawImage(spr, Math.floor(this.player.x), Math.floor(this.player.y));
          }
        }
      }

      // 7. Floating Scores
      for (let ft of this.floatingTexts) {
        this.drawText(ft.text, Math.floor(ft.x), Math.floor(ft.y), NES_PALETTE['Y'], 8);
      }

      // 8. HUD
      this.drawHUD();

      // 9. State Banners
      if (this.state === 'STAGE_INTRO') {
        this.drawText(`STAGE ${this.stage}`, CANVAS_WIDTH / 2 - 32, 175, NES_PALETTE['C'], 10);
        this.drawText('READY', CANVAS_WIDTH / 2 - 20, 195, NES_PALETTE['R'], 10);
      } else if (this.state === 'STAGE_CLEAR') {
        this.drawText('STAGE CLEAR!', CANVAS_WIDTH / 2 - 46, 175, NES_PALETTE['g'], 10);
      } else if (this.state === 'GAME_OVER') {
        this.drawText('GAME OVER', CANVAS_WIDTH / 2 - 38, 175, NES_PALETTE['R'], 10);
        if (this.stateTimer > 60 && Math.floor(this.tick / 20) % 2 === 0) {
          this.drawText('PUSH SPACE', CANVAS_WIDTH / 2 - 40, 205, NES_PALETTE['W'], 8);
        }
      }
    }

    drawHUD() {
      this.drawText('1UP', 24, 8, NES_PALETTE['R'], 8);
      this.drawText(this.formatScore(this.score), 18, 18, NES_PALETTE['W'], 8);

      this.drawText('HIGH SCORE', CANVAS_WIDTH / 2 - 36, 8, NES_PALETTE['R'], 8);
      this.drawText(this.formatScore(this.highScore), CANVAS_WIDTH / 2 - 16, 18, NES_PALETTE['W'], 8);

      for (let i = 0; i < this.lives - 1; i++) {
        const spr = this.sprites.get('player', 0);
        if (spr) {
          this.ctx.drawImage(spr, 10 + i * 14, CANVAS_HEIGHT - 16, 12, 12);
        }
      }

      const stageFlags = Math.min(this.stage, 8);
      for (let i = 0; i < stageFlags; i++) {
        const flagSpr = this.sprites.get('flag1', 0);
        if (flagSpr) {
          this.ctx.drawImage(flagSpr, CANVAS_WIDTH - 20 - (i * 12), CANVAS_HEIGHT - 16, 12, 12);
        }
      }
    }

    formatScore(val) {
      let s = val.toString();
      while (s.length < 5) s = '0' + s;
      return s;
    }

    drawText(text, x, y, color = '#ffffff', size = 8) {
      this.ctx.fillStyle = color;
      this.ctx.font = `${size}px 'Press Start 2P', monospace`;
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(text, x, y);
    }
  }

  // --- BOOTSTRAP WHEN DOM READY ---
  function initGame() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas #gameCanvas not found!');
      return;
    }

    const game = new Game(canvas);

    // CRT Toggle
    const btnCrt = document.getElementById('btnCrt');
    const crtOverlay = document.getElementById('crtOverlay');
    let crtEnabled = true;

    if (btnCrt && crtOverlay) {
      btnCrt.addEventListener('click', () => {
        crtEnabled = !crtEnabled;
        crtOverlay.style.display = crtEnabled ? 'block' : 'none';
        btnCrt.textContent = `CRT: ${crtEnabled ? 'ON' : 'OFF'}`;
      });
    }

    // Sound Toggle
    const btnSound = document.getElementById('btnSound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        game.audio.init();
        const isMuted = game.audio.toggleMute();
        btnSound.textContent = `DŹWIĘK: ${isMuted ? 'OFF' : 'ON'}`;
      });
    }

    // 60 FPS Loop
    let lastTime = 0;
    const interval = 1000 / 60;

    function loop(time) {
      requestAnimationFrame(loop);
      const delta = time - lastTime;
      if (delta > interval) {
        lastTime = time - (delta % interval);
        game.update();
        game.draw();
      }
    }

    requestAnimationFrame(loop);
    console.log('★ GALAXY NES 8-BIT STARTED SUCCESSFULLY ★');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }

})();
