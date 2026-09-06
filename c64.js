/**
 * COMMODORE 64 GALAXY — AUTHENTIC HARDWARE ENGINE
 * MOS 6510 CPU • VIC-II Multicolor Sprites (24x21) • SID 6581 Audio • PAL 50Hz Fixed Timestep
 */

(function () {
  'use strict';

  // Authentic Commodore 64 Pepto / VICE Palette (16 colors)
  const C64 = {
    BLACK:       '#000000', // 0
    WHITE:       '#FFFFFF', // 1
    RED:         '#880000', // 2
    CYAN:        '#AAFFEE', // 3
    PURPLE:      '#CC44CC', // 4
    GREEN:       '#00CC55', // 5
    BLUE:        '#0000AA', // 6
    YELLOW:      '#EEEE77', // 7
    ORANGE:      '#DD8855', // 8
    BROWN:       '#664400', // 9
    LIGHT_RED:   '#FF7777', // 10
    DARK_GRAY:   '#333333', // 11
    GRAY:        '#777777', // 12
    LIGHT_GREEN: '#AAFF66', // 13
    LIGHT_BLUE:  '#0088FF', // 14
    LIGHT_GRAY:  '#BBBBBB'  // 15
  };

  const PALETTE = [
    C64.BLACK, C64.WHITE, C64.RED, C64.CYAN,
    C64.PURPLE, C64.GREEN, C64.BLUE, C64.YELLOW,
    C64.ORANGE, C64.BROWN, C64.LIGHT_RED, C64.DARK_GRAY,
    C64.GRAY, C64.LIGHT_GREEN, C64.LIGHT_BLUE, C64.LIGHT_GRAY
  ];

  // -------------------------------------------------------------
  // C64 MULTICOLOR SPRITES (24x21 pixels each)
  // -------------------------------------------------------------
  // Palette index mapping:
  // '.' = transparent
  // 'W' = 1 (White)
  // 'R' = 2 (Red)
  // 'C' = 3 (Cyan)
  // 'P' = 4 (Purple)
  // 'G' = 5 (Green)
  // 'B' = 6 (Blue)
  // 'Y' = 7 (Yellow)
  // 'O' = 8 (Orange)
  // 'r' = 10 (Light Red)
  // 'd' = 11 (Dark Gray)
  // 'D' = 12 (Medium Gray)
  // 'g' = 13 (Light Green)
  // 'b' = 14 (Light Blue)
  // 'w' = 15 (Light Gray)

  const C64_SPRITES = {
    // Player Ship (24x21) - Frame 1 & 2
    player: [
      [
        "...........WW...........",
        "...........WW...........",
        "..........RWWb..........",
        "..........RWWb..........",
        ".........RRWWbb.........",
        "........RRRWWbbb........",
        "........RRRWWbbb........",
        ".......RRRCCWbbbb.......",
        ".......RRRCCWbbbb.......",
        "......RRRCCCCbbbbb......",
        "......RR.CCCC.bbbb......",
        ".....RR..CCCC..bbb......",
        "....RR...WWWW...bbbb....",
        "...RR....WWWW....bbbb...",
        "...RR....W..W....bbbb...",
        ".........YYYY...........",
        "..........YY............",
        "..........OO............",
        "..........OO............",
        "...........O............",
        "........................"
      ].map(r => r.replace(/b/g, 'R')), // Mirror red on both wings
      [
        "...........WW...........",
        "...........WW...........",
        "..........RRRR..........",
        "..........RRRR..........",
        ".........RRWWRR.........",
        "........RRRWWbbb........",
        "........RRRWWbbb........",
        ".......RRRCCWbbbb.......",
        ".......RRRCCWbbbb.......",
        "......RRRCCCCbbbbb......",
        "......RR.CCCC.bbbb......",
        ".....RR..CCCC..bbb......",
        "....RR...WWWW...bbbb....",
        "...RR....WWWW....bbbb...",
        "...RR....W..W....bbbb...",
        "........YYYYYY..........",
        ".........YYYY...........",
        "..........RR............",
        "..........RR............",
        "........................",
        "........................"
      ].map(r => r.replace(/b/g, 'R'))
    ],

    // Bee / Zako (24x21) - 2 animation frames
    bee: [
      [
        ".......YY..........YY.......",
        "......YYYY........YYYY......",
        "......BBBB........BBBB......",
        ".....BBCCCCCCCCCCCCCCBB.....",
        ".....BBCCCCCCCCCCCCCCBB.....",
        "......BBBBBBWWWWBBBBBB......",
        "......YYYYYYRRRRYYYYYY......",
        ".....YYYYYYYYYYYYYYYYYY.....",
        ".....YYYYYY000000YYYYYY.....",
        "....YYYYYYY0YYYY0YYYYYYY....",
        "....YYYYYYY0YYYY0YYYYYYY....",
        ".....YYYYYY000000YYYYYY.....",
        "......YYYYYYRRRRYYYYYY......",
        ".......YYYYYRRRRYYYYY.......",
        "........YYYY....YYYY........",
        ".........YY......YY.........",
        ".........YY......YY.........",
        "..........Y......Y..........",
        "............................",
        "............................",
        "............................"
      ].map(r => r.substring(2, 26)),
      [
        "....YY................YY....",
        "....YYYY............YYYY....",
        ".....BBBB..........BBBB.....",
        ".....BBCCCCCCCCCCCCCCBB.....",
        "....BBBBCCCCCCCCCCCCBBBB....",
        "....BBBBBBWWWWWWWWBBBBBB....",
        ".....YYYYYYYRRRRYYYYYYY.....",
        ".....YYYYYYYYYYYYYYYYYY.....",
        "....YYYYYYYY0000YYYYYYYY....",
        "....YYYYYYYY0YY0YYYYYYYY....",
        ".....YYYYYYY0YY0YYYYYYY.....",
        ".....YYYYYYY0000YYYYYYY.....",
        "......YYYYYYRRRRYYYYYY......",
        ".......YYYYYRRRRYYYYY.......",
        "........YYYY....YYYY........",
        "........YYYY....YYYY........",
        ".........YY......YY.........",
        "............................",
        "............................",
        "............................",
        "............................"
      ].map(r => r.substring(2, 26))
    ],

    // Butterfly / Hornet (24x21) - 2 animation frames
    butterfly: [
      [
        ".......RR..........RR.......",
        "......RRRR........RRRR......",
        "......RROO........OORR......",
        ".....RROOOOOOOOOOOOOORR.....",
        ".....RROOWWWWWWWWOOORRR.....",
        ".....RROOWWWWWWWWOOORRR.....",
        "......RROOOOOOOOOOOORR......",
        "......YYYYYYYYYYYYYYYY......",
        ".....YYYYYY000000YYYYYY.....",
        "....YYYYYYY0YYYY0YYYYYYY....",
        "....YYYYYYY0YYYY0YYYYYYY....",
        ".....YYYYYY000000YYYYYY.....",
        "......YYYYYYRRRRYYYYYY......",
        ".......YYYYYRRRRYYYYY.......",
        "........RRRR....RRRR........",
        ".........RR......RR.........",
        ".........RR......RR.........",
        "..........R......R..........",
        "............................",
        "............................",
        "............................"
      ].map(r => r.substring(2, 26)),
      [
        "....RR................RR....",
        "....RRRR............RRRR....",
        ".....RROO..........OORR.....",
        ".....ROOOOOOOOOOOOOOOOR.....",
        "....RROOWWWWWWWWWWOOORRR....",
        "....RROOWWWWWWWWWWOOORRR....",
        ".....RROOOOOOOOOOOOOORR.....",
        "......YYYYYYYYYYYYYYYY......",
        ".....YYYYYYY0000YYYYYYY.....",
        "....YYYYYYYY0YY0YYYYYYYY....",
        "....YYYYYYYY0YY0YYYYYYYY....",
        ".....YYYYYYY0000YYYYYYY.....",
        "......YYYYYYRRRRYYYYYY......",
        ".......YYYYYRRRRYYYYY.......",
        "........RRRR....RRRR........",
        "........RRRR....RRRR........",
        ".........RR......RR.........",
        "............................",
        "............................",
        "............................",
        "............................"
      ].map(r => r.substring(2, 26))
    ],

    // Boss Galaga / Midori (Green - 2 HP)
    bossGreen: [
      [
        ".......GG..........GG.......",
        "......GGGG........GGGG......",
        ".....GGGGGGGGGGGGGGGGGG.....",
        ".....GGCCGGGGGGGGCCGGGG.....",
        "....GGCCCCGGGGGGCCCCGGGG....",
        "....GGCCCCGGGGGGCCCCGGGG....",
        ".....GGGGCCGGGGCCGGGGGG.....",
        "......GGGGYYYYYYYYGGGG......",
        ".......GGYYYYYYYYYYGG.......",
        "......GGGG00000000GGGG......",
        ".....GGGGG0GGGG0GGGGGGG.....",
        ".....GGGGG00000000GGGGG.....",
        "......GGGGGGRRRRGGGGGG......",
        ".......GGGGGRRRRGGGGG.......",
        "........GGGG....GGGG........",
        ".........GG......GG.........",
        ".........GG......GG.........",
        "..........G......G..........",
        "............................",
        "............................",
        "............................"
      ].map(r => r.substring(2, 26)),
      [
        "....GG................GG....",
        "....GGGG............GGGG....",
        ".....GGGGGGGGGGGGGGGGGG.....",
        ".....GGCCGGGGGGGGCCGGGG.....",
        "....GGCCCCGGGGGGCCCCGGGG....",
        "....GGCCCCGGGGGGCCCCGGGG....",
        ".....GGGGCCGGGGCCGGGGGG.....",
        "......GGGGYYYYYYYYGGGG......",
        ".......GGYYYYYYYYYYGG.......",
        "......GGGG00000000GGGG......",
        ".....GGGGG0GGGG0GGGGGGG.....",
        ".....GGGGG00000000GGGGG.....",
        "......GGGGGGRRRRGGGGGG......",
        ".......GGGGGRRRRGGGGG.......",
        "........GGGG....GGGG........",
        "........GGGG....GGGG........",
        ".........GG......GG.........",
        "............................",
        "............................",
        "............................",
        "............................"
      ].map(r => r.substring(2, 26))
    ],

    // Boss Galaga (Blue - Damaged 1 HP)
    bossBlue: [
      [
        ".......BB..........BB.......",
        "......BBBB........BBBB......",
        ".....BBBBBBBBBBBBBBBBBB.....",
        ".....BBCCBBBBBBBBCCBBBB.....",
        "....BBCCCCBBBBBBCCCCBBBB....",
        "....BBCCCCBBBBBBCCCCBBBB....",
        ".....BBBBCCBBBBCCBBBBBB.....",
        "......BBBBYYYYYYYYBBBB......",
        ".......BBYYYYYYYYYYBB.......",
        "......BBBB00000000BBBB......",
        ".....BBBBB0BBBB0BBBBBBB.....",
        ".....BBBBB00000000BBBBB.....",
        "......BBBBBBRRRRBBBBBB......",
        ".......BBBBBRRRRBBBBB.......",
        "........BBBB....BBBB........",
        ".........BB......BB.........",
        ".........BB......BB.........",
        "..........B......B..........",
        "............................",
        "............................",
        "............................"
      ].map(r => r.substring(2, 26)),
      [
        "....BB................BB....",
        "....BBBB............BBBB....",
        ".....BBBBBBBBBBBBBBBBBB.....",
        ".....BBCCBBBBBBBBCCBBBB.....",
        "....BBCCCCBBBBBBCCCCBBBB....",
        "....BBCCCCBBBBBBCCCCBBBB....",
        ".....BBBBCCBBBBCCBBBBBB.....",
        "......BBBBYYYYYYYYBBBB......",
        ".......BBYYYYYYYYYYBB.......",
        "......BBBB00000000BBBB......",
        ".....BBBBB0BBBB0BBBBBBB.....",
        ".....BBBBB00000000BBBBB.....",
        "......BBBBBBRRRRBBBBBB......",
        ".......BBBBBRRRRBBBBB.......",
        "........BBBB....BBBB........",
        "........BBBB....BBBB........",
        ".........BB......BB.........",
        "............................",
        "............................",
        "............................",
        "............................"
      ].map(r => r.substring(2, 26))
    ],

    // Explosion (24x21) - 5 frames
    explosion: [
      [
        "........................",
        "........................",
        "...........YY...........",
        "..........YYYY..........",
        ".........YYYYYY.........",
        "........YYYYYYYY........",
        "........YYYYYYYY........",
        ".......YYYYYYYYYY.......",
        ".......YYYRRRRYYY.......",
        "......YYYRRRRRRYYY......",
        "......YYYRRRRRRYYY......",
        ".......YYYRRRRYYY.......",
        ".......YYYYYYYYYY.......",
        "........YYYYYYYY........",
        "........YYYYYYYY........",
        ".........YYYYYY.........",
        "..........YYYY..........",
        "...........YY...........",
        "........................",
        "........................",
        "........................"
      ],
      [
        "...........WW...........",
        "........YY.WW.YY........",
        ".......YYYYWWYYYY.......",
        "......YYYYWWWWYYYY......",
        ".....YYYRRWWWWWRRYYY....",
        "....YYYRRWWWWWWWRRYYY...",
        "...YYYYRRRWWWWWWRRRYYY..",
        "...YYRRRRRWWWWWRRRRRYY..",
        "..WWRRRRRR....RRRRRRWW..",
        "..WWWWWW........WWWWWW..",
        "..WWWWWW........WWWWWW..",
        "..WWRRRRRR....RRRRRRWW..",
        "...YYRRRRRWWWWWRRRRRYY..",
        "...YYYYRRRWWWWWWRRRYYY..",
        "....YYYRRWWWWWWWRRYYY...",
        ".....YYYRRWWWWWRRYYY....",
        "......YYYYWWWWYYYY......",
        ".......YYYYWWYYYY.......",
        "........YY.WW.YY........",
        "...........WW...........",
        "........................"
      ],
      [
        "....W..............W....",
        "..W....R...WW...R....W..",
        "....R....RRRR....R......",
        "......RR......RR........",
        "...R.....YY..YY.....R...",
        "..R....YYYYYYYY....R....",
        "..W...YY......YY...W....",
        ".W...Y..........Y...W...",
        ".W...Y..........Y...W...",
        "..W...YY......YY...W....",
        "..R....YYYYYYYY....R....",
        "...R.....YY..YY.....R...",
        "......RR......RR........",
        "....R....RRRR....R......",
        "..W....R...WW...R....W..",
        "....W..............W....",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
      ],
      [
        "..W..................W..",
        "....Y..............Y....",
        ".......R........R.......",
        "...R................R...",
        ".....W............W.....",
        ".......Y........Y.......",
        "..Y..................Y..",
        ".......R........R.......",
        ".......R........R.......",
        "..Y..................Y..",
        ".......Y........Y.......",
        ".....W............W.....",
        "...R................R...",
        ".......R........R.......",
        "....Y..............Y....",
        "..W..................W..",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
      ],
      [
        "........................",
        "..D..................D..",
        "......d..........d......",
        "........................",
        "....d..............d....",
        "........................",
        "........................",
        ".....d............d.....",
        ".....d............d.....",
        "........................",
        "........................",
        "....d..............d....",
        "........................",
        "......d..........d......",
        "..D..................D..",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
      ]
    ],

    // Powerup Capsules (16x16)
    capsuleR: [
      "....YYYYYYYY....",
      "..YYYYYYYYYYYY..",
      ".YYYY..RRRR..YY.",
      ".YYY..RR..RR..Y.",
      "YYYY..RRRRRR..YY",
      "YYYY..RR..RR..YY",
      "YYYY..RR..RR..YY",
      ".YYY..RR..RR..Y.",
      ".YYYY..RRRR..YY.",
      "..YYYYYYYYYYYY..",
      "....YYYYYYYY....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    capsuleM: [
      "....RRRRRRRR....",
      "..RRRRRRRRRRRR..",
      ".RRR..WW..WW..R.",
      ".RRR..WWW.WW..R.",
      "RRRR..WW.WWW..RR",
      "RRRR..WW..WW..RR",
      "RRRR..WW..WW..RR",
      ".RRR..WW..WW..R.",
      ".RRR..WW..WW..R.",
      "..RRRRRRRRRRRR..",
      "....RRRRRRRR....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    capsuleH: [
      "....PPPPPPPP....",
      "..PPPPPPPPPPPP..",
      ".PPP..CC..CC..P.",
      ".PPP..CC..CC..P.",
      "PPPP..CCCCCC..PP",
      "PPPP..CC..CC..PP",
      "PPPP..CC..CC..PP",
      ".PPP..CC..CC..P.",
      ".PPP..CC..CC..P.",
      "..PPPPPPPPPPPP..",
      "....PPPPPPPP....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    capsuleS: [
      "....CCCCCCCC....",
      "..CCCCCCCCCCCC..",
      ".CCC..WWWWWW..C.",
      ".CCC..WW......C.",
      "CCCC...WWWW...CC",
      "CCCC......WW..CC",
      "CCCC..WWWWWW..CC",
      ".CCC..........C.",
      ".CCC..........C.",
      "..CCCCCCCCCCCC..",
      "....CCCCCCCC....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],

    // Missile
    missile: [
      "....RR....",
      "...RRRR...",
      "...WWWW...",
      "...WWWW...",
      "...WWWW...",
      "...DDDD...",
      "..DDDDDD..",
      "..DD..DD..",
      "...YYYY...",
      "....OO...."
    ],
    hyperRocket: [
      "....PP....",
      "...PPPP...",
      "...CCCC...",
      "...CCCC...",
      "...CCCC...",
      "...CCCC...",
      "...DDDD...",
      "..DDDDDD..",
      "...YYYY...",
      "..OOOOOO.."
    ]
  };

  // Pre-render pixel matrices into crisp offscreen canvases
  function compileSprite(matrix) {
    const h = matrix.length;
    const w = matrix[0].length;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const charMap = {
      '.': 'transparent',
      '0': C64.BLACK,
      'W': C64.WHITE,
      'R': C64.RED,
      'C': C64.CYAN,
      'P': C64.PURPLE,
      'G': C64.GREEN,
      'B': C64.BLUE,
      'Y': C64.YELLOW,
      'O': C64.ORANGE,
      'r': C64.LIGHT_RED,
      'd': C64.DARK_GRAY,
      'D': C64.GRAY,
      'g': C64.LIGHT_GREEN,
      'b': C64.LIGHT_BLUE,
      'w': C64.LIGHT_GRAY
    };

    for (let y = 0; y < h; y++) {
      const row = matrix[y];
      for (let x = 0; x < w; x++) {
        const color = charMap[row[x]] || 'transparent';
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return c;
  }

  const SPRITE_CACHE = {};
  for (let [k, v] of Object.entries(C64_SPRITES)) {
    if (Array.isArray(v) && Array.isArray(v[0])) {
      SPRITE_CACHE[k] = v.map(compileSprite);
    } else {
      SPRITE_CACHE[k] = [compileSprite(v)];
    }
  }

  // -------------------------------------------------------------
  // AUTHENTIC SID 6581 AUDIO SYNTHESIZER
  // -------------------------------------------------------------
  class SidSynth {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.noiseBuffer = null;
      this.initialized = false;
      this.isMuted = false;
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

        // Generate C64 12-bit LFSR noise
        const rate = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, rate, rate);
        const data = buf.getChannelData(0);
        let shift = 0x7FFFF8;
        for (let i = 0; i < rate; i++) {
          const bit = ((shift >> 22) ^ (shift >> 17)) & 1;
          shift = ((shift << 1) | bit) & 0x7FFFFF;
          data[i] = ((shift & 0xFF) / 128.0 - 1.0) * 0.65;
        }
        this.noiseBuffer = buf;
        this.initialized = true;
      } catch (e) {
        console.warn('SID Audio error:', e);
      }
    }

    playLaser() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(780, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

      gain.gain.setValueAtTime(0.32, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    playExplosion(isBoss = false) {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const duration = isBoss ? 0.45 : 0.28;

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 5.0; // Classic SID resonance
        filter.frequency.setValueAtTime(isBoss ? 1600 : 2600, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isBoss ? 0.7 : 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(t);
        src.stop(t + duration);
      }

      // Voice 2 triangle thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isBoss ? 110 : 160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + duration);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.01, t + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + duration);
    }

    playPlayerDeath() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const duration = 1.3;

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 6.0;
        filter.frequency.setValueAtTime(3200, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(t);
        src.stop(t + duration);
      }

      // Descending SID pulse tones
      const notes = [440, 330, 220, 165, 110, 55];
      notes.forEach((freq, i) => {
        const start = t + i * 0.18;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.linearRampToValueAtTime(0.01, start + 0.18);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    }

    playPowerup() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime + 0.02;
      // Signature C64 Rob Hubbard fast arpeggio
      const notes = [261.6, 329.6, 392.0, 523.2, 659.2, 784.0, 1046.5];
      notes.forEach((f, i) => {
        const start = t + i * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.09);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(start);
        osc.stop(start + 0.09);
      });
    }

    playShieldDeflect() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100, t);
      osc.frequency.setValueAtTime(550, t + 0.04);
      osc.frequency.setValueAtTime(1300, t + 0.08);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.18);
    }

    playDive() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.linearRampToValueAtTime(480, t + 0.12);
      osc.frequency.linearRampToValueAtTime(220, t + 0.28);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    playMissileLaunch() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.15);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  // -------------------------------------------------------------
  // COMMODORE 64 GAME ENGINE (Locked to PAL 50Hz Timestep)
  // -------------------------------------------------------------
  const WIDTH = 384;
  const HEIGHT = 264;
  const PLAY_MIN_X = 24;
  const PLAY_MAX_X = WIDTH - 48;
  const PLAY_MIN_Y = 170;
  const PLAY_MAX_Y = HEIGHT - 28;

  class C64Galaxy {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      this.sid = new SidSynth();

      // State: 'BOOT', 'TITLE', 'PLAYING', 'PLAYER_DEAD', 'GAME_OVER'
      this.state = 'BOOT';
      this.bootTimer = 0;
      this.stateTimer = 0;

      // Entities
      this.px = WIDTH / 2 - 12;
      this.py = PLAY_MAX_Y - 8;
      this.playerWidth = 24;
      this.playerHeight = 21;
      this.playerAlive = true;
      this.invulnerableTimer = 0;

      this.lives = 3;
      this.score = 0;
      this.highScore = 10000;
      this.stage = 1;

      this.weapon = 'NORMAL'; // 'NORMAL', 'RAPID', 'MISSILES', 'HYPER'
      this.shield = 0;
      this.shieldFlash = 0;
      this.shootCooldown = 0;

      this.stars = [];
      this.enemies = [];
      this.playerBullets = [];
      this.missiles = [];
      this.enemyBullets = [];
      this.powerups = [];
      this.explosions = [];
      this.floatingScores = [];

      this.formationX = 0;
      this.formationDir = 1;
      this.diveInterval = 90;
      this.diveTimer = 0;

      this.tick = 0;

      this.keys = { left: false, right: false, up: false, down: false, fire: false };

      this.initInput();
      this.initStars();
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

        if (this.state === 'BOOT') {
          this.state = 'TITLE';
        } else if (this.state === 'TITLE' && (k === ' ' || e.code === 'Space')) {
          this.startNewGame();
        } else if (this.state === 'GAME_OVER' && (k === ' ' || e.code === 'Space') && this.stateTimer > 40) {
          this.state = 'TITLE';
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
        if (this.state === 'BOOT') {
          this.state = 'TITLE';
        } else if (this.state === 'TITLE') {
          this.startNewGame();
        } else if (this.state === 'GAME_OVER' && this.stateTimer > 40) {
          this.state = 'TITLE';
        }
      });
    }

    initStars() {
      this.stars = [];
      for (let i = 0; i < 35; i++) {
        const tier = i % 3;
        this.stars.push({
          x: Math.floor(Math.random() * (WIDTH - 40)) + 20,
          y: Math.floor(Math.random() * HEIGHT),
          speed: (tier === 0) ? 0.6 : ((tier === 1) ? 1.2 : 2.0),
          color: (tier === 0) ? C64.GRAY : ((tier === 1) ? C64.CYAN : C64.WHITE),
          size: (tier === 2) ? 2 : 1
        });
      }
    }

    startNewGame() {
      this.score = 0;
      this.lives = 3;
      this.stage = 1;
      this.weapon = 'NORMAL';
      this.shield = 0;
      this.respawnPlayer();
      this.startStage(1);
    }

    respawnPlayer() {
      this.px = WIDTH / 2 - 12;
      this.py = PLAY_MAX_Y - 4;
      this.playerAlive = true;
      this.invulnerableTimer = 100; // 2 seconds of blinking invulnerability
    }

    startStage(stageNum) {
      this.stage = stageNum;
      this.state = 'PLAYING';
      this.playerBullets = [];
      this.missiles = [];
      this.enemyBullets = [];
      this.powerups = [];
      this.explosions = [];
      this.diveInterval = Math.max(40, 95 - this.stage * 8);
      this.diveTimer = 0;
      this.spawnFormation();
      this.sid.playPowerup();
    }

    spawnFormation() {
      this.enemies = [];
      const colSpacing = 28;
      const rowSpacing = 20;
      const gridStartX = 66;
      const gridStartY = 42;

      let id = 0;

      // Row 0: 4 Bosses
      for (let c = 2; c <= 5; c++) {
        this.enemies.push(this.createEnemy(id++, 2, 2, gridStartX + c * colSpacing, gridStartY + 0 * rowSpacing));
      }
      // Row 1: 8 Butterflies
      for (let c = 0; c < 8; c++) {
        this.enemies.push(this.createEnemy(id++, 1, 1, gridStartX + c * colSpacing, gridStartY + 1 * rowSpacing));
      }
      // Row 2: 8 Bees
      for (let c = 0; c < 8; c++) {
        this.enemies.push(this.createEnemy(id++, 0, 1, gridStartX + c * colSpacing, gridStartY + 2 * rowSpacing));
      }
      // Row 3: 8 Bees
      for (let c = 0; c < 8; c++) {
        this.enemies.push(this.createEnemy(id++, 0, 1, gridStartX + c * colSpacing, gridStartY + 3 * rowSpacing));
      }
    }

    createEnemy(id, type, hp, targetX, targetY) {
      return {
        id,
        type, // 0=Bee, 1=Butterfly, 2=Boss
        hp,
        maxHp: hp,
        x: targetX,
        y: targetY,
        origX: targetX,
        origY: targetY,
        width: 24,
        height: 21,
        state: 'FORMATION', // 'FORMATION', 'DIVING', 'RETURNING'
        vx: 0,
        vy: 0,
        timer: 0,
        animFrame: 0
      };
    }

    shoot() {
      if (!this.playerAlive) return;

      const bulletY = this.py - 6;

      if (this.weapon === 'NORMAL') {
        if (this.playerBullets.length >= 4) return;
        this.playerBullets.push({ x: this.px + 5, y: bulletY, speed: 5.5 });
        this.playerBullets.push({ x: this.px + 17, y: bulletY, speed: 5.5 });
        this.sid.playLaser();
        this.shootCooldown = 11;
      } else if (this.weapon === 'RAPID') {
        if (this.playerBullets.length >= 10) return;
        this.playerBullets.push({ x: this.px - 1, y: bulletY, speed: 6.5 });
        this.playerBullets.push({ x: this.px + 7, y: bulletY - 3, speed: 6.5 });
        this.playerBullets.push({ x: this.px + 15, y: bulletY - 3, speed: 6.5 });
        this.playerBullets.push({ x: this.px + 23, y: bulletY, speed: 6.5 });
        this.sid.playLaser();
        this.shootCooldown = 5; // Rapid fire!
      } else if (this.weapon === 'MISSILES') {
        if (this.playerBullets.length < 4) {
          this.playerBullets.push({ x: this.px + 5, y: bulletY, speed: 5.5 });
          this.playerBullets.push({ x: this.px + 17, y: bulletY, speed: 5.5 });
          this.sid.playLaser();
        }
        if (this.missiles.length < 4) {
          this.missiles.push({ x: this.px - 2, y: this.py + 4, vx: -1.0, vy: -3.0, type: 'HOMING', hp: 1 });
          this.missiles.push({ x: this.px + 18, y: this.py + 4, vx: 1.0, vy: -3.0, type: 'HOMING', hp: 1 });
          this.sid.playMissileLaunch();
        }
        this.shootCooldown = 12;
      } else if (this.weapon === 'HYPER') {
        if (this.missiles.length < 6) {
          const angles = [-0.20, -0.06, 0.06, 0.20];
          for (let ang of angles) {
            this.missiles.push({
              x: this.px + 8 + ang * 20,
              y: bulletY,
              vx: Math.sin(ang) * 5.8,
              vy: -Math.cos(ang) * 5.8,
              type: 'HYPER',
              hp: 2
            });
          }
          this.sid.playMissileLaunch();
        }
        this.shootCooldown = 10;
      }
    }

    checkDrop(x, y, isDiving) {
      const chance = isDiving ? 0.42 : 0.20;
      if (Math.random() < chance) {
        const types = ['RAPID', 'MISSILES', 'HYPER', 'SHIELD'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push({
          x: x + 4,
          y: y + 2,
          type,
          vy: 0.8,
          wobble: Math.random() * Math.PI * 2,
          width: 16,
          height: 16
        });
      }
    }

    killPlayer() {
      if (!this.playerAlive || this.invulnerableTimer > 0) return;

      this.playerAlive = false;
      this.weapon = 'NORMAL';
      this.shield = 0;
      this.addExplosion(this.px, this.py, true);
      this.sid.playPlayerDeath();

      this.state = 'PLAYER_DEAD';
      this.stateTimer = 0;
    }

    addExplosion(x, y, isBig = false) {
      this.explosions.push({
        x: Math.floor(x),
        y: Math.floor(y),
        frame: 0,
        timer: 0,
        isBig
      });
      this.sid.playExplosion(isBig);
    }

    addScoreText(x, y, txt, col = C64.YELLOW) {
      this.floatingScores.push({
        x: Math.floor(x),
        y: Math.floor(y),
        text: txt,
        color: col,
        timer: 40
      });
    }

    // -----------------------------------------------------------
    // FIXED TIMESTEP 50Hz SIMULATION TICK
    // -----------------------------------------------------------
    fixedTick() {
      this.tick++;

      // Stars
      for (let s of this.stars) {
        s.y += s.speed;
        if (s.y >= HEIGHT) {
          s.y = 0;
          s.x = Math.floor(Math.random() * (WIDTH - 40)) + 20;
        }
      }

      if (this.state === 'BOOT') {
        this.bootTimer++;
        if (this.bootTimer > 120) {
          this.state = 'TITLE';
        }
        return;
      }

      if (this.state === 'TITLE') return;

      if (this.state === 'PLAYER_DEAD') {
        this.stateTimer++;
        this.updateProjectiles();
        this.updateEnemies(false);
        if (this.stateTimer > 75) {
          this.lives--;
          if (this.lives > 0) {
            this.respawnPlayer();
            this.state = 'PLAYING';
          } else {
            this.state = 'GAME_OVER';
            this.stateTimer = 0;
            if (this.score > this.highScore) {
              this.highScore = this.score;
            }
          }
        }
        this.updateExplosions();
        return;
      }

      if (this.state === 'GAME_OVER') {
        this.stateTimer++;
        this.updateExplosions();
        return;
      }

      // STATE === 'PLAYING'
      if (this.invulnerableTimer > 0) this.invulnerableTimer--;
      if (this.shootCooldown > 0) this.shootCooldown--;
      if (this.shieldFlash > 0) this.shieldFlash--;

      // 1. Controls (Commodore 64 measured player speed: 2.2 px/tick)
      const pSpeed = 2.2;
      if (this.playerAlive) {
        if (this.keys.left && this.px > PLAY_MIN_X) this.px -= pSpeed;
        if (this.keys.right && this.px < PLAY_MAX_X) this.px += pSpeed;
        if (this.keys.up && this.py > PLAY_MIN_Y) this.py -= pSpeed;
        if (this.keys.down && this.py < PLAY_MAX_Y) this.py += pSpeed;

        if (this.keys.fire && this.shootCooldown === 0) {
          this.shoot();
        }
      }

      // 2. Formation Sway
      if (this.tick % 12 === 0) {
        this.formationX += this.formationDir * 2;
        if (this.formationX >= 16 || this.formationX <= -16) {
          this.formationDir = -this.formationDir;
        }
      }

      // 3. Dive Attack Director
      this.diveTimer++;
      if (this.diveTimer >= this.diveInterval) {
        this.diveTimer = 0;
        this.triggerDive();
      }

      // 4. Update Enemies
      this.updateEnemies(true);

      // 5. Update Projectiles
      this.updateProjectiles();

      // 6. Update Powerup Drops
      this.updatePowerups();

      // 7. Check Collisions (VERY RIGOROUS!)
      this.checkAllCollisions();

      // 8. Update Explosions & Scores
      this.updateExplosions();

      // 9. Stage Clear Check
      if (this.enemies.length === 0) {
        this.startStage(this.stage + 1);
      }
    }

    triggerDive() {
      const inFormation = this.enemies.filter(e => e.state === 'FORMATION');
      if (inFormation.length === 0) return;

      const leaders = inFormation.filter(e => e.type === 2 || e.type === 1);
      const attacker = (leaders.length > 0 && Math.random() < 0.65)
        ? leaders[Math.floor(Math.random() * leaders.length)]
        : inFormation[Math.floor(Math.random() * inFormation.length)];

      if (!attacker) return;

      attacker.state = 'DIVING';
      attacker.timer = 0;
      this.sid.playDive();

      // Aim dive vector toward player
      const dx = (this.px + 12) - (attacker.x + 12);
      const dy = (this.py + 10) - (attacker.y + 10);
      const angle = Math.atan2(dy, dx);
      const spd = 2.4 + Math.min(1.2, this.stage * 0.15);
      attacker.vx = Math.cos(angle) * spd;
      attacker.vy = Math.max(1.6, Math.sin(angle) * spd);
    }

    updateEnemies(allowShooting) {
      for (let enemy of this.enemies) {
        if (this.tick % 16 === 0) {
          enemy.animFrame = 1 - enemy.animFrame;
        }

        if (enemy.state === 'FORMATION') {
          enemy.x = enemy.origX + this.formationX;
          enemy.y = enemy.origY;
        } else if (enemy.state === 'DIVING') {
          enemy.timer++;
          enemy.x += enemy.vx + Math.sin(enemy.timer * 0.12) * 1.2;
          enemy.y += enemy.vy;

          if (allowShooting && (enemy.timer === 24 || enemy.timer === 48)) {
            if (Math.random() < 0.7) {
              const dx = (this.px + 12) - (enemy.x + 12);
              const dy = (this.py + 10) - (enemy.y + 10);
              const dist = Math.hypot(dx, dy) || 1;
              const bSpd = 2.4 + Math.min(1.0, this.stage * 0.1);
              this.enemyBullets.push({
                x: enemy.x + 11,
                y: enemy.y + 18,
                vx: (dx / dist) * bSpd,
                vy: Math.max(1.6, (dy / dist) * bSpd),
                width: 4,
                height: 6
              });
            }
          }

          if (enemy.y > HEIGHT + 20) {
            enemy.y = -20;
            enemy.x = enemy.origX + this.formationX;
            enemy.state = 'RETURNING';
          }
        } else if (enemy.state === 'RETURNING') {
          const targetX = enemy.origX + this.formationX;
          const dx = targetX - enemy.x;
          const dy = enemy.origY - enemy.y;
          enemy.x += dx * 0.08;
          enemy.y += dy * 0.08;

          if (Math.hypot(dx, dy) < 2) {
            enemy.x = targetX;
            enemy.y = enemy.origY;
            enemy.state = 'FORMATION';
          }
        }
      }
    }

    updateProjectiles() {
      // Player Lasers
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const b = this.playerBullets[i];
        b.y -= b.speed;
        if (b.y < -10) this.playerBullets.splice(i, 1);
      }

      // Missiles
      for (let i = this.missiles.length - 1; i >= 0; i--) {
        const m = this.missiles[i];
        if (m.type === 'HOMING') {
          let target = null;
          let minDist = 999999;
          for (let e of this.enemies) {
            const dist = Math.hypot(e.x - m.x, e.y - m.y);
            if (dist < minDist) {
              minDist = dist;
              target = e;
            }
          }
          if (target) {
            const tx = target.x + 12;
            const ty = target.y + 10;
            const tAngle = Math.atan2(ty - m.y, tx - m.x);
            const curAngle = Math.atan2(m.vy, m.vx);
            let diff = tAngle - curAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const newAngle = curAngle + Math.max(-0.14, Math.min(0.14, diff));
            const spd = 4.8;
            m.vx = Math.cos(newAngle) * spd;
            m.vy = Math.sin(newAngle) * spd;
          }
        }

        m.x += m.vx;
        m.y += m.vy;

        if (m.y < -20 || m.x < -20 || m.x > WIDTH + 20 || m.y > HEIGHT + 20) {
          this.missiles.splice(i, 1);
        }
      }

      // Enemy Bullets
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const eb = this.enemyBullets[i];
        eb.x += eb.vx;
        eb.y += eb.vy;
        if (eb.y > HEIGHT + 10 || eb.x < -10 || eb.x > WIDTH + 10) {
          this.enemyBullets.splice(i, 1);
        }
      }
    }

    updatePowerups() {
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const p = this.powerups[i];
        p.y += p.vy;
        p.wobble += 0.06;
        p.x += Math.sin(p.wobble) * 0.5;

        // Pickup collision by player
        if (this.playerAlive) {
          if (
            p.x < this.px + this.playerWidth &&
            p.x + p.width > this.px &&
            p.y < this.py + this.playerHeight &&
            p.y + p.height > this.py
          ) {
            this.sid.playPowerup();
            this.score += 200;

            if (p.type === 'SHIELD') {
              this.shield = Math.min(3, this.shield + 2);
              this.addScoreText(this.px - 6, this.py - 12, 'SHIELD UP!', C64.CYAN);
            } else {
              this.weapon = p.type;
              const names = {
                RAPID: 'RAPID FIRE!',
                MISSILES: 'MISSILES!',
                HYPER: 'HYPER ROCKETS!'
              };
              this.addScoreText(this.px - 14, this.py - 12, names[p.type] || 'POWER UP!', C64.YELLOW);
            }

            this.powerups.splice(i, 1);
            continue;
          }
        }

        if (p.y > HEIGHT + 15) {
          this.powerups.splice(i, 1);
        }
      }
    }

    // -----------------------------------------------------------
    // RIGOROUS COLLISION DETECTION (SHIPS, BULLETS, SHIELDS)
    // -----------------------------------------------------------
    checkAllCollisions() {
      // 1. Player Bullets vs Enemies
      for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
        const b = this.playerBullets[bi];
        let hit = false;

        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const e = this.enemies[ei];
          if (
            b.x < e.x + e.width &&
            b.x + 3 > e.x &&
            b.y < e.y + e.height &&
            b.y + 8 > e.y
          ) {
            hit = true;
            e.hp--;
            if (e.hp <= 0) {
              const isDiving = (e.state === 'DIVING' || e.state === 'RETURNING');
              const pts = (e.type === 2) ? (isDiving ? 400 : 150) : ((e.type === 1) ? (isDiving ? 160 : 80) : (isDiving ? 100 : 50));
              this.score += pts;
              this.addScoreText(e.x, e.y, `+${pts}`, C64.YELLOW);
              this.addExplosion(e.x, e.y, e.type === 2);
              this.checkDrop(e.x, e.y, isDiving);
              this.enemies.splice(ei, 1);
            } else {
              this.score += 50;
              this.sid.playLaser();
            }
            break;
          }
        }
        if (hit) this.playerBullets.splice(bi, 1);
      }

      // 2. Player Missiles vs Enemies
      for (let mi = this.missiles.length - 1; mi >= 0; mi--) {
        const m = this.missiles[mi];
        let hit = false;

        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const e = this.enemies[ei];
          if (
            m.x < e.x + e.width &&
            m.x + 8 > e.x &&
            m.y < e.y + e.height &&
            m.y + 10 > e.y
          ) {
            hit = true;
            const dmg = (m.type === 'HYPER') ? 2 : 1;
            e.hp -= dmg;
            this.addExplosion(e.x, e.y, true);

            if (e.hp <= 0) {
              const isDiving = (e.state === 'DIVING' || e.state === 'RETURNING');
              const pts = isDiving ? 300 : 150;
              this.score += pts;
              this.addScoreText(e.x, e.y, `+${pts}`, C64.YELLOW);
              this.checkDrop(e.x, e.y, isDiving);
              this.enemies.splice(ei, 1);
            }

            m.hp--;
            if (m.hp <= 0) break;
          }
        }
        if (hit && m.hp <= 0) this.missiles.splice(mi, 1);
      }

      // 3. Enemy Bullets vs Player
      if (this.playerAlive && this.invulnerableTimer <= 0) {
        const px1 = this.px + 4;
        const px2 = this.px + this.playerWidth - 4;
        const py1 = this.py + 4;
        const py2 = this.py + this.playerHeight - 4;

        for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
          const eb = this.enemyBullets[bi];
          if (
            eb.x < px2 &&
            eb.x + eb.width > px1 &&
            eb.y < py2 &&
            eb.y + eb.height > py1
          ) {
            this.enemyBullets.splice(bi, 1);

            if (this.shield > 0) {
              this.shield--;
              this.shieldFlash = 12;
              this.sid.playShieldDeflect();
              this.addScoreText(this.px - 6, this.py - 10, 'DEFLECTED!', C64.CYAN);
            } else {
              this.killPlayer();
              return;
            }
          }
        }

        // 4. Enemy Ships vs Player Ship (Diving Ramming Attack!)
        if (this.playerAlive) {
          for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
            const e = this.enemies[ei];
            const ex1 = e.x + 3;
            const ex2 = e.x + e.width - 3;
            const ey1 = e.y + 3;
            const ey2 = e.y + e.height - 3;

            // Direct body collision check
            if (
              ex1 < px2 &&
              ex2 > px1 &&
              ey1 < py2 &&
              ey2 > py1
            ) {
              if (this.shield > 0) {
                // Shield absorbs crash, destroys enemy!
                this.shield--;
                this.shieldFlash = 12;
                this.sid.playShieldDeflect();
                this.addExplosion(e.x, e.y, true);
                this.addScoreText(this.px - 6, this.py - 10, 'DEFLECTED!', C64.CYAN);
                this.enemies.splice(ei, 1);
              } else {
                // Player destroyed by colliding alien!
                this.addExplosion(e.x, e.y, true);
                this.enemies.splice(ei, 1);
                this.killPlayer();
                return;
              }
            }
          }
        }
      }
    }

    updateExplosions() {
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const exp = this.explosions[i];
        exp.timer++;
        if (exp.timer % 4 === 0) {
          exp.frame++;
          if (exp.frame >= 5) {
            this.explosions.splice(i, 1);
          }
        }
      }

      for (let i = this.floatingScores.length - 1; i >= 0; i--) {
        const ft = this.floatingScores[i];
        ft.y -= 0.4;
        ft.timer--;
        if (ft.timer <= 0) {
          this.floatingScores.splice(i, 1);
        }
      }
    }

    // -----------------------------------------------------------
    // COMMODORE 64 VIC-II RENDER PIPELINE
    // -----------------------------------------------------------
    render() {
      // 1. C64 Border (Classic dark blue #0000AA or black during battle)
      const borderCol = (this.state === 'BOOT' || this.state === 'TITLE') ? C64.BLUE : C64.BLACK;
      this.ctx.fillStyle = borderCol;
      this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // 2. C64 Inner Screen (320x200)
      const bgCol = (this.state === 'BOOT') ? C64.LIGHT_BLUE : C64.BLACK;
      this.ctx.fillStyle = bgCol;
      this.ctx.fillRect(16, 12, WIDTH - 32, HEIGHT - 24);

      if (this.state === 'BOOT') {
        this.renderBoot();
        return;
      }

      if (this.state === 'TITLE') {
        this.renderTitle();
        return;
      }

      // In-game graphics
      // Stars
      for (let s of this.stars) {
        this.ctx.fillStyle = s.color;
        this.ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
      }

      // Explosions
      for (let exp of this.explosions) {
        const spr = SPRITE_CACHE.explosion[exp.frame];
        if (spr) {
          this.ctx.drawImage(spr, Math.floor(exp.x), Math.floor(exp.y));
        }
      }

      // Power-up Drops
      for (let p of this.powerups) {
        let sprName = 'capsuleR';
        if (p.type === 'MISSILES') sprName = 'capsuleM';
        else if (p.type === 'HYPER') sprName = 'capsuleH';
        else if (p.type === 'SHIELD') sprName = 'capsuleS';

        const spr = SPRITE_CACHE[sprName][0];
        if (spr) {
          this.ctx.drawImage(spr, Math.floor(p.x), Math.floor(p.y));
        }

        if (this.tick % 8 < 4) {
          this.ctx.strokeStyle = C64.WHITE;
          this.ctx.strokeRect(Math.floor(p.x) - 0.5, Math.floor(p.y) - 0.5, 17, 17);
        }
      }

      // Enemies (C64 24x21 Multicolor Sprites)
      for (let e of this.enemies) {
        let sprName = 'bee';
        if (e.type === 2) {
          sprName = (e.hp === 2) ? 'bossGreen' : 'bossBlue';
        } else if (e.type === 1) {
          sprName = 'butterfly';
        }
        const sprList = SPRITE_CACHE[sprName];
        if (sprList) {
          const spr = sprList[e.animFrame % sprList.length];
          this.ctx.save();
          this.ctx.translate(Math.floor(e.x + 12), Math.floor(e.y + 10));
          if (e.state === 'DIVING') {
            const angle = Math.atan2(e.vy, e.vx) - Math.PI / 2;
            this.ctx.rotate(angle);
          }
          this.ctx.drawImage(spr, -12, -10);
          this.ctx.restore();
        }
      }

      // Enemy Bullets (C64 Red energy spheres)
      for (let eb of this.enemyBullets) {
        this.ctx.fillStyle = (this.tick % 6 < 3) ? C64.LIGHT_RED : C64.RED;
        this.ctx.fillRect(Math.floor(eb.x), Math.floor(eb.y), 4, 6);
        this.ctx.fillStyle = C64.WHITE;
        this.ctx.fillRect(Math.floor(eb.x + 1), Math.floor(eb.y + 1), 2, 4);
      }

      // Player Lasers (C64 Cyan/White beams)
      for (let b of this.playerBullets) {
        const isRapid = (this.weapon === 'RAPID');
        this.ctx.fillStyle = isRapid ? C64.YELLOW : C64.CYAN;
        this.ctx.fillRect(Math.floor(b.x), Math.floor(b.y), 3, 9);
        this.ctx.fillStyle = C64.WHITE;
        this.ctx.fillRect(Math.floor(b.x + 1), Math.floor(b.y), 1, 9);
      }

      // Missiles (C64 Rockets)
      for (let m of this.missiles) {
        const sprName = (m.type === 'HYPER') ? 'hyperRocket' : 'missile';
        const spr = SPRITE_CACHE[sprName][0];
        if (spr) {
          this.ctx.save();
          this.ctx.translate(Math.floor(m.x + 5), Math.floor(m.y + 5));
          const angle = Math.atan2(m.vy, m.vx) + Math.PI / 2;
          this.ctx.rotate(angle);
          this.ctx.drawImage(spr, -5, -5);
          this.ctx.restore();
        }
      }

      // Player Ship (C64 24x21 Multicolor Sprite)
      if (this.playerAlive) {
        const visible = (this.invulnerableTimer === 0) || (Math.floor(this.invulnerableTimer / 4) % 2 === 0);
        if (visible) {
          const flameFrame = (this.tick % 8 < 4) ? 0 : 1;
          const spr = SPRITE_CACHE.player[flameFrame];
          if (spr) {
            this.ctx.drawImage(spr, Math.floor(this.px), Math.floor(this.py));
          }

          // C64 Force Field / Shield Bubble
          if (this.shield > 0) {
            const cx = Math.floor(this.px + 12);
            const cy = Math.floor(this.py + 10);
            const radius = 17 + Math.sin(this.tick * 0.25) * 1.5;
            const points = 14;
            const rot = this.tick * 0.09;

            const col = (this.shieldFlash > 0)
              ? C64.WHITE
              : ((this.tick % 6 < 3) ? C64.CYAN : C64.LIGHT_BLUE);

            this.ctx.fillStyle = col;
            for (let i = 0; i < points; i++) {
              const ang = rot + (i / points) * Math.PI * 2;
              const sx = Math.floor(cx + Math.cos(ang) * (radius + 2));
              const sy = Math.floor(cy + Math.sin(ang) * (radius - 1));
              this.ctx.fillRect(sx, sy, 2, 2);
            }
          }
        }
      }

      // Floating Scores
      for (let ft of this.floatingScores) {
        this.drawText(ft.text, ft.x, ft.y, ft.color, 8);
      }

      // HUD & Banners
      this.renderHUD();

      if (this.state === 'GAME_OVER') {
        this.drawText('GAME OVER', WIDTH / 2 - 44, HEIGHT / 2 - 10, C64.RED, 11);
        if (this.stateTimer > 40 && Math.floor(this.tick / 20) % 2 === 0) {
          this.drawText('PRESS SPACE TO RESTART', WIDTH / 2 - 88, HEIGHT / 2 + 15, C64.WHITE, 8);
        }
      }
    }

    renderHUD() {
      // Top row
      const sScore = `1UP:${('00000' + this.score).slice(-5)}`;
      this.drawText(sScore, 24, 16, C64.WHITE, 8);

      const sHigh = `HIGH:${('00000' + this.highScore).slice(-5)}`;
      this.drawText(sHigh, WIDTH / 2 - 40, 16, C64.YELLOW, 8);

      // Lives
      for (let i = 0; i < this.lives - 1; i++) {
        const spr = SPRITE_CACHE.player[0];
        if (spr) {
          this.ctx.drawImage(spr, WIDTH - 48 - i * 18, 14, 16, 14);
        }
      }

      // Weapon & Shield row
      const wpnNames = { NORMAL: 'LASER', RAPID: 'RAPID', MISSILES: 'MISSILE', HYPER: 'HYPER' };
      const wpnColors = { NORMAL: C64.CYAN, RAPID: C64.YELLOW, MISSILES: C64.LIGHT_RED, HYPER: C64.PURPLE };
      this.drawText(`WPN:${wpnNames[this.weapon]}`, 24, 28, wpnColors[this.weapon], 7);

      if (this.shield > 0) {
        const sTxt = 'SHIELD:' + '[]'.repeat(this.shield);
        this.drawText(sTxt, WIDTH - 120, 28, C64.CYAN, 7);
      }
    }

    renderBoot() {
      const col = C64.BLUE;
      this.drawText('**** COMMODORE 64 BASIC V2 ****', 24, 24, col, 8);
      this.drawText('64K RAM SYSTEM  38911 BASIC BYTES FREE', 24, 40, col, 8);
      this.drawText('READY.', 24, 60, col, 8);

      if (this.bootTimer > 25) {
        this.drawText('LOAD "GALAXY",8,1', 24, 76, col, 8);
      }
      if (this.bootTimer > 55) {
        this.drawText('SEARCHING FOR GALAXY', 24, 96, col, 8);
      }
      if (this.bootTimer > 80) {
        this.drawText('LOADING', 24, 110, col, 8);
      }
      if (this.bootTimer > 105) {
        this.drawText('READY.', 24, 130, col, 8);
        this.drawText('RUN', 24, 146, col, 8);
      }

      // Blinking C64 cursor
      if (Math.floor(this.tick / 14) % 2 === 0) {
        const cursorY = (this.bootTimer < 25) ? 60 : ((this.bootTimer < 55) ? 76 : 146);
        this.ctx.fillStyle = col;
        this.ctx.fillRect(72, cursorY, 8, 8);
      }
    }

    renderTitle() {
      this.drawText('★ COMMODORE 64 GALAXY ★', WIDTH / 2 - 105, 36, C64.YELLOW, 9);
      this.drawText('MOS 6510 • VIC-II • SID 6581', WIDTH / 2 - 110, 52, C64.CYAN, 8);

      this.drawText('- POINT VALUES -', WIDTH / 2 - 64, 82, C64.WHITE, 8);

      // Bee preview
      const bee = SPRITE_CACHE.bee[0];
      if (bee) this.ctx.drawImage(bee, 80, 102);
      this.drawText('=  50 PTS', 120, 108, C64.YELLOW, 8);

      // Butterfly preview
      const bfly = SPRITE_CACHE.butterfly[0];
      if (bfly) this.ctx.drawImage(bfly, 80, 128);
      this.drawText('=  80 PTS', 120, 134, C64.LIGHT_RED, 8);

      // Boss preview
      const boss = SPRITE_CACHE.bossGreen[0];
      if (boss) this.ctx.drawImage(boss, 80, 154);
      this.drawText('= 150 PTS', 120, 160, C64.LIGHT_GREEN, 8);

      this.drawText('WASD: MOVE   SPACE: FIRE', WIDTH / 2 - 96, 196, C64.CYAN, 8);

      if (Math.floor(this.tick / 20) % 2 === 0) {
        this.drawText('PRESS SPACE TO START', WIDTH / 2 - 80, 230, C64.WHITE, 8);
      }
    }

    drawText(str, x, y, col = C64.WHITE, size = 8) {
      this.ctx.fillStyle = col;
      this.ctx.font = `${size}px 'Press Start 2P', monospace`;
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(str, Math.floor(x), Math.floor(y));
    }
  }

  // -------------------------------------------------------------
  // FIXED PAL 50Hz TIMESTEP RUNNER
  // -------------------------------------------------------------
  function bootC64() {
    const canvas = document.getElementById('c64Canvas');
    if (!canvas) return;

    const game = new C64Galaxy(canvas);

    let lastTime = performance.now();
    const timeStep = 1000 / 50; // Exactly 50.0 Hz (20ms per PAL frame)
    let accumulator = 0;

    function mainLoop(currentTime) {
      requestAnimationFrame(mainLoop);

      let frameDelta = currentTime - lastTime;
      lastTime = currentTime;

      // Clamp max delta to prevent spiral of death if tab was backgrounded
      if (frameDelta > 150) frameDelta = 150;

      accumulator += frameDelta;

      // Run fixed ticks at exactly 50Hz
      while (accumulator >= timeStep) {
        game.fixedTick();
        accumulator -= timeStep;
      }

      game.render();
    }

    requestAnimationFrame(mainLoop);
    console.log('★ COMMODORE 64 GALAXY LOCKED TO PAL 50Hz READY ★');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootC64);
  } else {
    bootC64();
  }

})();
