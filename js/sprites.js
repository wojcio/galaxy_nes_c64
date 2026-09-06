/**
 * GALAXY - 8-Bit NES Sprite Engine
 * Authentic NES Color Palette & Pixel Art Bitmaps (16x16 & 8x8)
 */

export const NES_PALETTE = {
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

// 16x16 Pixel Art Data
export const SPRITE_DATA = {
  // Player Fighter Ship (Frame 1 & 2 with flame animation)
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

  // Drone / Bee (Yellow & Blue alien) - 2 animation frames
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

  // Butterfly / Hornet (Red & Yellow alien) - 2 animation frames
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

  // Boss Galaga / Flagship (Green & Blue) - Healthy (Green)
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

  // Boss Galaga - Damaged (Blue)
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

  // Explosion frames (5 frames of expanding retro blast)
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

  // Stage Badge Flags (for displaying at the bottom right)
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
  ],

  flag5: [
    "....YYYYYY......",
    "....YYYYYY......",
    "....YYYYYY......",
    "....YYYYYY......",
    "....YYYYYY......",
    "....YYYYYY......",
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
  ],

  // Power-Up Capsules (12x12 8-bit retro badges)
  capsuleR: [
    "..YYYYYYYY..",
    ".YYYYYYYYYY.",
    "YY..RRRR..YY",
    "YY..R...R.YY",
    "YY..RRRR..YY",
    "YY..R..R..YY",
    "YY..R...R.YY",
    "YY..R...R.YY",
    ".YYYYYYYYYY.",
    "..YYYYYYYY.."
  ],

  capsuleM: [
    "..RRRRRRRR..",
    ".RRRRRRRRRR.",
    "RR..WW..WW.RR",
    "RR..WWW.WW.RR",
    "RR..WW.WWW.RR",
    "RR..WW..WW.RR",
    "RR..WW..WW.RR",
    "RR..WW..WW.RR",
    ".RRRRRRRRRR.",
    "..RRRRRRRR.."
  ],

  capsuleH: [
    "..PPPPPPPP..",
    ".PPPPPPPPPP.",
    "PP..CC..CC.PP",
    "PP..CC..CC.PP",
    "PP..CCCCCC.PP",
    "PP..CC..CC.PP",
    "PP..CC..CC.PP",
    "PP..CC..CC.PP",
    ".PPPPPPPPPP.",
    "..PPPPPPPP.."
  ],

  capsuleS: [
    "..CCCCCCCC..",
    ".CCCCCCCCCC.",
    "CC..WWWWWW.CC",
    "CC..WW.....CC",
    "CC...WWWW..CC",
    "CC......WW.CC",
    "CC..WWWWWW.CC",
    "CC.........CC",
    ".CCCCCCCCCC.",
    "..CCCCCCCC.."
  ],

  // Missiles
  missile: [
    "...RR...",
    "..RRRR..",
    "..WWWW..",
    "..WWWW..",
    "..WWWW..",
    "..DDDD..",
    ".DDDDDD.",
    ".DD..DD.",
    "..YYYY..",
    "...OO..."
  ],

  hyperRocket: [
    "...PP...",
    "..PPPP..",
    "..CCCC..",
    "..CCCC..",
    "..CCCC..",
    "..CCCC..",
    "..DDDD..",
    ".DDDDDD.",
    "..YYYY..",
    ".OOOOOO."
  ]
};

/**
 * Pre-renders sprite matrix into an HTML5 Canvas for ultra-fast blitting
 */
export function createOffscreenCanvas(width, height) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas: c, ctx: ctx };
}

export class SpriteCache {
  constructor() {
    this.cache = new Map();
    this.init();
  }

  init() {
    for (const [key, val] of Object.entries(SPRITE_DATA)) {
      if (Array.isArray(val) && Array.isArray(val[0])) {
        // Multi-frame animated sprite
        this.cache.set(key, val.map(frame => this.renderMatrix(frame)));
      } else if (Array.isArray(val)) {
        // Single frame sprite
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
