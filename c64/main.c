/**
 * GALAXY - Authentic Commodore 64 Arcade Edition
 * MOS 6510 • VIC-II Hardware Sprites & Custom Character Set • SID 6581 Audio
 * (C) 2026 Retro Gaming Project
 */

#include <stdlib.h>
#include <string.h>
#include <conio.h>
#include <c64.h>
#include <peekpoke.h>

// VIC-II Bank 1 Memory Map ($4000 - $7FFF)
#define SCREEN_BASE     0x6000
#define CHARSET_BASE    0x6800
#define SPRITE_BASE     0x7000
#define COLOR_BASE      0xD800

// Sprite Pointers in Bank 1 (Screen at $6000, pointers at $63F8-$63FF)
#define SP0_PTR         0x63F8
#define SP1_PTR         0x63F9
#define SP2_PTR         0x63FA
#define SP3_PTR         0x63FB

// Sprite Blocks relative to Bank 1 ($4000)
// ($7000 - $4000) / 64 = 12288 / 64 = 192
#define BLOCK_SP_PLAYER 192 // $7000
#define BLOCK_SP_SHIELD 193 // $7040
#define BLOCK_SP_DIVE   194 // $7080
#define BLOCK_SP_EXP    195 // $70C0

// VIC-II Registers
#define VIC_SP0_X       0xD000
#define VIC_SP0_Y       0xD001
#define VIC_SP1_X       0xD002
#define VIC_SP1_Y       0xD003
#define VIC_SP2_X       0xD004
#define VIC_SP2_Y       0xD005
#define VIC_SP3_X       0xD006
#define VIC_SP3_Y       0xD007
#define VIC_MSB_X       0xD010
#define VIC_CTRL1       0xD011
#define VIC_RASTER      0xD012
#define VIC_SP_ENA      0xD015
#define VIC_CTRL2       0xD016
#define VIC_SP_EXP_Y    0xD017
#define VIC_MEM_PTR     0xD018
#define VIC_SP_EXP_X    0xD01D
#define VIC_BORDER      0xD020
#define VIC_BG0         0xD021
#define VIC_SP_COL_MC   0xD01C
#define VIC_SP0_COL     0xD027
#define VIC_SP1_COL     0xD028
#define VIC_SP2_COL     0xD029
#define VIC_SP3_COL     0xD02A

// SID 6581 Registers
#define SID_BASE        0xD400
#define SID_V1_FREQ_LO  0xD400
#define SID_V1_FREQ_HI  0xD401
#define SID_V1_CTRL     0xD404
#define SID_V1_AD       0xD405
#define SID_V1_SR       0xD406
#define SID_V3_FREQ_LO  0xD40E
#define SID_V3_FREQ_HI  0xD40F
#define SID_V3_CTRL     0xD412
#define SID_V3_AD       0xD413
#define SID_V3_SR       0xD414
#define SID_VOLUME      0xD418

// CIA Ports
#define CIA1_PRA        0xDC00
#define CIA2_PRA        0xDD00
#define CIA2_DDRA       0xDD02

// Custom Character Codes (Characters 64..77)
#define CH_BEE_L        64
#define CH_BEE_R        65
#define CH_BFLY_L       66
#define CH_BFLY_R       67
#define CH_BOSS_L       68
#define CH_BOSS_R       69
#define CH_STAR1        70
#define CH_STAR2        71
#define CH_EBULLET      72
#define CH_PBULLET      73
#define CH_CAPSULE_L    74
#define CH_CAPSULE_R    75
#define CH_FLAG         76
#define CH_LIFE         77

// Weapon types
#define WPN_NORMAL      0
#define WPN_RAPID       1
#define WPN_MISSILE     2
#define WPN_HYPER       3

// Max limits
#define MAX_STARS       18
#define MAX_ENEMIES     24
#define MAX_PBULLETS    6
#define MAX_EBULLETS    4
#define MAX_MISSILES    4

// Star struct
typedef struct {
    unsigned char x;
    unsigned char y;
    unsigned char speed;
    unsigned char ch;
    unsigned char color;
} Star;

// Enemy struct
typedef struct {
    unsigned char active;
    unsigned char type; // 0=Bee, 1=Butterfly, 2=Boss
    unsigned char hp;
    unsigned char targetX;
    unsigned char targetY;
    unsigned char curX;
    unsigned char curY;
    unsigned char state; // 0=Formation, 1=Diving, 2=Returning
    unsigned char timer;
} Enemy;

// Bullet struct
typedef struct {
    unsigned char active;
    unsigned char x;
    unsigned char y;
} Bullet;

// Missile struct
typedef struct {
    unsigned char active;
    unsigned char x;
    unsigned char y;
    unsigned char type; // 0=Homing, 1=Hyper
} Missile;

// Drop Capsule struct
typedef struct {
    unsigned char active;
    unsigned char x;
    unsigned char y;
    unsigned char type; // 'R', 'M', 'H', 'S'
    unsigned char color;
} Drop;

// Precalculated Screen & Color RAM row addresses
static const unsigned int screen_rows[25] = {
    0x6000, 0x6028, 0x6050, 0x6078, 0x60A0, 0x60C8, 0x60F0, 0x6118,
    0x6140, 0x6168, 0x6190, 0x61B8, 0x61E0, 0x6208, 0x6230, 0x6258,
    0x6280, 0x62A8, 0x62D0, 0x62F8, 0x6320, 0x6348, 0x6370, 0x6398, 0x63C0
};
static const unsigned int color_rows[25] = {
    0xD800, 0xD828, 0xD850, 0xD878, 0xD8A0, 0xD8C8, 0xD8F0, 0xD918,
    0xD940, 0xD968, 0xD990, 0xD9B8, 0xD9E0, 0xDA08, 0xDA30, 0xDA58,
    0xDA80, 0xDAA8, 0xDAD0, 0xDAF8, 0xDB20, 0xDB48, 0xDB70, 0xDB98, 0xDBC0
};

#define FAST_CHAR(x, y, ch, col) do { \
    POKE(screen_rows[(y)] + (x), (ch)); \
    POKE(color_rows[(y)] + (x), (col)); \
} while(0)

#define FAST_CLEAR(x, y) POKE(screen_rows[(y)] + (x), 32)

// Globals
static Star stars[MAX_STARS];
static Enemy enemies[MAX_ENEMIES];
static Bullet pBullets[MAX_PBULLETS];
static Bullet eBullets[MAX_EBULLETS];
static Missile missiles[MAX_MISSILES];
static Drop drop;

// Player state (X in pixel coords: 32..300, Y in pixel coords: 60..240)
static unsigned int playerPixelX = 160;
static unsigned char playerPixelY = 224;
static unsigned char playerWeapon = WPN_NORMAL;
static unsigned char playerShield = 0;
static unsigned char lives = 3;
static unsigned int score = 0;
static unsigned int highScore = 10000;
static unsigned char stage = 1;
static unsigned char formationSway = 0;
static signed char formationDir = 1;
static unsigned int tick = 0;
static unsigned char shootCooldown = 0;
static unsigned char formationNeedsRedraw = 1;
static unsigned char explosionTimer = 0;

// -------------------------------------------------------------
// HARDWARE SPRITE BITMAPS (24x21 pixels each = 64 bytes)
// -------------------------------------------------------------

// Player Ship (24x21 high-res VIC-II sprite)
static const unsigned char sprite_player[64] = {
    0x00, 0x18, 0x00,
    0x00, 0x18, 0x00,
    0x00, 0x3C, 0x00,
    0x00, 0x3C, 0x00,
    0x00, 0x7E, 0x00,
    0x00, 0xFF, 0x00,
    0x01, 0xFF, 0x80,
    0x03, 0xBD, 0xC0,
    0x07, 0xBD, 0xE0,
    0x0F, 0xFF, 0xF0,
    0x1F, 0xE7, 0xF8,
    0x3F, 0xC3, 0xFC,
    0x7F, 0x81, 0xFE,
    0xFF, 0x18, 0xFF,
    0xFF, 0x3C, 0xFF,
    0x7F, 0xFF, 0xFE,
    0x3C, 0x7E, 0x3C,
    0x18, 0x3C, 0x18,
    0x00, 0x18, 0x00,
    0x00, 0x18, 0x00,
    0x00, 0x00, 0x00,
    0x00
};

// Force Field Shield Aura (24x21 sprite)
static const unsigned char sprite_shield[64] = {
    0x03, 0xFF, 0xC0,
    0x0F, 0xFF, 0xF0,
    0x1E, 0x00, 0x78,
    0x3C, 0x00, 0x3C,
    0x78, 0x00, 0x1E,
    0x70, 0x00, 0x0E,
    0xE0, 0x00, 0x07,
    0xE0, 0x00, 0x07,
    0xC0, 0x00, 0x03,
    0xC0, 0x00, 0x03,
    0xC0, 0x00, 0x03,
    0xC0, 0x00, 0x03,
    0xC0, 0x00, 0x03,
    0xE0, 0x00, 0x07,
    0xE0, 0x00, 0x07,
    0x70, 0x00, 0x0E,
    0x78, 0x00, 0x1E,
    0x3C, 0x00, 0x3C,
    0x1E, 0x00, 0x78,
    0x0F, 0xFF, 0xF0,
    0x03, 0xFF, 0xC0,
    0x00
};

// Diving Alien (24x21 high-res sprite)
static const unsigned char sprite_dive[64] = {
    0x06, 0x00, 0x60,
    0x0F, 0x00, 0xF0,
    0x1F, 0x81, 0xF8,
    0x1F, 0xC3, 0xF8,
    0x3E, 0x66, 0x7C,
    0x3E, 0x7E, 0x7C,
    0x7F, 0xFF, 0xFE,
    0x7F, 0xFF, 0xFE,
    0xFF, 0x99, 0xFF,
    0xFF, 0x00, 0xFF,
    0xFF, 0x00, 0xFF,
    0x7F, 0xDB, 0xFE,
    0x7F, 0xFF, 0xFE,
    0x3F, 0xFF, 0xFC,
    0x1F, 0xFF, 0xF8,
    0x0F, 0xC3, 0xF0,
    0x07, 0x81, 0xE0,
    0x03, 0x00, 0xC0,
    0x03, 0x00, 0xC0,
    0x01, 0x00, 0x80,
    0x00, 0x00, 0x00,
    0x00
};

// Explosion Fireball (24x21 sprite)
static const unsigned char sprite_exp[64] = {
    0x00, 0x18, 0x00,
    0x01, 0xBD, 0x80,
    0x07, 0xBD, 0xE0,
    0x0E, 0x7E, 0x70,
    0x1C, 0xFF, 0x38,
    0x39, 0xDB, 0x9C,
    0x7B, 0x81, 0xDE,
    0x67, 0x00, 0xE6,
    0xCF, 0x00, 0xF3,
    0xDE, 0x00, 0x7B,
    0xDE, 0x00, 0x7B,
    0xCF, 0x00, 0xF3,
    0x67, 0x00, 0xE6,
    0x7B, 0x81, 0xDE,
    0x39, 0xDB, 0x9C,
    0x1C, 0xFF, 0x38,
    0x0E, 0x7E, 0x70,
    0x07, 0xBD, 0xE0,
    0x01, 0xBD, 0x80,
    0x00, 0x18, 0x00,
    0x00, 0x00, 0x00,
    0x00
};

// -------------------------------------------------------------
// CUSTOM CHARACTER SET BITMAPS (8x8 bytes each)
// -------------------------------------------------------------
static const unsigned char custom_tiles[14][8] = {
    // 0: Bee Left (CH_BEE_L)
    { 0x03, 0x07, 0x0E, 0x7F, 0xFF, 0x7D, 0x3E, 0x0C },
    // 1: Bee Right (CH_BEE_R)
    { 0xC0, 0xE0, 0x70, 0xFE, 0xFF, 0xBE, 0x7C, 0x30 },
    // 2: Butterfly Left (CH_BFLY_L)
    { 0x01, 0x1B, 0x7F, 0xFE, 0xFD, 0x7F, 0x36, 0x04 },
    // 3: Butterfly Right (CH_BFLY_R)
    { 0x80, 0xD8, 0xFE, 0x7F, 0xBF, 0xFE, 0x6C, 0x20 },
    // 4: Boss Left (CH_BOSS_L)
    { 0x07, 0x1F, 0x3B, 0x7F, 0xFF, 0xEF, 0x66, 0x24 },
    // 5: Boss Right (CH_BOSS_R)
    { 0xE0, 0xF8, 0xDC, 0xFE, 0xFF, 0xF7, 0x66, 0x24 },
    // 6: Star 1 (CH_STAR1)
    { 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00 },
    // 7: Star 2 (CH_STAR2)
    { 0x00, 0x00, 0x10, 0x38, 0x10, 0x00, 0x00, 0x00 },
    // 8: Alien Bullet (CH_EBULLET)
    { 0x00, 0x18, 0x3C, 0x3C, 0x18, 0x00, 0x00, 0x00 },
    // 9: Player Bullet (CH_PBULLET)
    { 0x18, 0x18, 0x18, 0x18, 0x18, 0x00, 0x00, 0x00 },
    // 10: Capsule Left (CH_CAPSULE_L)
    { 0x3C, 0x7E, 0x66, 0x7E, 0x66, 0x66, 0x7E, 0x3C },
    // 11: Capsule Right (CH_CAPSULE_R)
    { 0x3C, 0x7E, 0x66, 0x7E, 0x66, 0x66, 0x7E, 0x3C },
    // 12: Stage Flag (CH_FLAG)
    { 0xFE, 0xFE, 0xFC, 0xF8, 0x30, 0x30, 0x30, 0xFC },
    // 13: Life Icon (CH_LIFE)
    { 0x18, 0x3C, 0x7E, 0xFF, 0xBD, 0x99, 0x18, 0x00 }
};

// -------------------------------------------------------------
// HARDWARE INITIALIZATION (VIC-II Bank 1 at $4000-$7FFF)
// -------------------------------------------------------------

void init_c64_hardware(void) {
    unsigned char orig_port;
    unsigned int i;

    // 1. Copy 2048 bytes of ROM font into RAM at $6800 (with SEI/CLI)
    asm("sei");
    orig_port = PEEK(0x01);
    POKE(0x01, orig_port & ~0x04); // Map Character ROM at $D000-$DFFF
    for (i = 0; i < 2048; ++i) {
        POKE(CHARSET_BASE + i, PEEK(0xD000 + i));
    }
    POKE(0x01, orig_port); // Restore I/O registers
    asm("cli");

    // 2. Inject custom Galaga arcade graphics into characters 64..77
    for (i = 0; i < 14; ++i) {
        memcpy((void*)(CHARSET_BASE + (64 + i) * 8), custom_tiles[i], 8);
    }

    // 3. Copy VIC-II Hardware Sprites into Sprite Blocks at $7000
    memcpy((void*)0x7000, sprite_player, 64);
    memcpy((void*)0x7040, sprite_shield, 64);
    memcpy((void*)0x7080, sprite_dive, 64);
    memcpy((void*)0x70C0, sprite_exp, 64);

    // 4. Switch VIC-II to Bank 1 ($4000-$7FFF)
    POKE(CIA2_DDRA, PEEK(CIA2_DDRA) | 0x03);
    POKE(CIA2_PRA, (PEEK(CIA2_PRA) & ~0x03) | 0x02);

    // 5. Register $D018: Screen at $6000 (bits 7-4 = 8), Chargen at $6800 (bits 3-1 = 5)
    POKE(VIC_MEM_PTR, 0x8A);

    // 6. Setup Sprite Pointers in Screen RAM ($6000 + 1016 = $63F8)
    POKE(SP0_PTR, BLOCK_SP_PLAYER);
    POKE(SP1_PTR, BLOCK_SP_SHIELD);
    POKE(SP2_PTR, BLOCK_SP_DIVE);
    POKE(SP3_PTR, BLOCK_SP_EXP);

    // 7. Setup Sprite Colors and Modes (High-res 24x21)
    POKE(VIC_SP_COL_MC, 0x00); // Standard high-res sprites
    POKE(VIC_SP_EXP_X, 0x00);  // Normal width
    POKE(VIC_SP_EXP_Y, 0x00);  // Normal height
    POKE(VIC_SP0_COL, COLOR_WHITE);
    POKE(VIC_SP1_COL, COLOR_CYAN);
    POKE(VIC_SP2_COL, COLOR_LIGHTRED);
    POKE(VIC_SP3_COL, COLOR_YELLOW);

    // Enable Sprite 0 (Player) initially
    POKE(VIC_SP_ENA, 0x01);

    // Borders and screen background
    POKE(VIC_BORDER, COLOR_BLUE);
    POKE(VIC_BG0, COLOR_BLACK);
}

// -------------------------------------------------------------
// SID 6581 AUDIO SYNTHESIZER
// -------------------------------------------------------------

void sid_init(void) {
    unsigned char i;
    for (i = 0; i < 25; ++i) {
        POKE(SID_BASE + i, 0);
    }
    POKE(SID_VOLUME, 15);
}

void sid_laser(void) {
    POKE(SID_V1_FREQ_HI, 0x48);
    POKE(SID_V1_FREQ_LO, 0x00);
    POKE(SID_V1_AD, 0x09);
    POKE(SID_V1_SR, 0x00);
    POKE(SID_V1_CTRL, 0x21); // Sawtooth + Gate
}

void sid_explode(void) {
    POKE(SID_V3_FREQ_HI, 0x18);
    POKE(SID_V3_FREQ_LO, 0x00);
    POKE(SID_V3_AD, 0x0C);
    POKE(SID_V3_SR, 0x00);
    POKE(SID_V3_CTRL, 0x81); // Noise + Gate
}

void sid_powerup(void) {
    POKE(SID_V1_FREQ_HI, 0x60);
    POKE(SID_V1_FREQ_LO, 0x00);
    POKE(SID_V1_AD, 0x28);
    POKE(SID_V1_SR, 0x90);
    POKE(SID_V1_CTRL, 0x11); // Triangle + Gate
}

void sid_shield(void) {
    POKE(SID_V1_FREQ_HI, 0x80);
    POKE(SID_V1_FREQ_LO, 0x00);
    POKE(SID_V1_AD, 0x05);
    POKE(SID_V1_SR, 0x00);
    POKE(SID_V1_CTRL, 0x41); // Pulse + Gate
}

// -------------------------------------------------------------
// SCREEN HELPERS
// -------------------------------------------------------------

void clear_screen(void) {
    unsigned int i;
    for (i = 0; i < 1000; ++i) {
        POKE(SCREEN_BASE + i, 32);
        POKE(COLOR_BASE + i, 1);
    }
}

void printText(unsigned char col, unsigned char row, const char* str, unsigned char color) {
    unsigned int s = screen_rows[row] + col;
    unsigned int c = color_rows[row] + col;
    while (*str) {
        char ch = *str++;
        unsigned char sc;
        if (ch >= 'A' && ch <= 'Z') sc = ch - 'A' + 1;
        else if (ch >= 'a' && ch <= 'z') sc = ch - 'a' + 1;
        else if (ch >= '0' && ch <= '9') sc = ch - '0' + 48;
        else if (ch == ' ') sc = 32;
        else if (ch == ':') sc = 58;
        else if (ch == '-') sc = 45;
        else if (ch == '*') sc = 42;
        else if (ch == '/') sc = 47;
        else if (ch == '=') sc = 61;
        else sc = 32;

        POKE(s++, sc);
        POKE(c++, color);
    }
}

// -------------------------------------------------------------
// STARS
// -------------------------------------------------------------

void init_stars(void) {
    unsigned char i;
    for (i = 0; i < MAX_STARS; ++i) {
        stars[i].x = (rand() % 38) + 1;
        stars[i].y = (rand() % 23) + 1;
        stars[i].speed = (i % 3) + 1;
        stars[i].ch = (i % 2 == 0) ? CH_STAR1 : CH_STAR2;
        stars[i].color = (i % 3 == 0) ? COLOR_GRAY3 : ((i % 3 == 1) ? COLOR_CYAN : COLOR_WHITE);
    }
}

void update_stars(void) {
    unsigned char i;
    for (i = 0; i < MAX_STARS; ++i) {
        FAST_CLEAR(stars[i].x, stars[i].y);
        if (tick % (4 - stars[i].speed) == 0) {
            stars[i].y++;
            if (stars[i].y >= 24) {
                stars[i].y = 2;
                stars[i].x = (rand() % 38) + 1;
            }
        }
        FAST_CHAR(stars[i].x, stars[i].y, stars[i].ch, stars[i].color);
    }
}

// -------------------------------------------------------------
// ENEMY FORMATION
// -------------------------------------------------------------

void init_formation(void) {
    unsigned char col, row, i = 0;

    // Row 0: 4 Bosses
    for (col = 0; col < 4; ++col) {
        enemies[i].active = 1;
        enemies[i].type = 2;
        enemies[i].hp = 2;
        enemies[i].targetX = 11 + col * 5;
        enemies[i].targetY = 4;
        enemies[i].curX = enemies[i].targetX;
        enemies[i].curY = enemies[i].targetY;
        enemies[i].state = 0;
        enemies[i].timer = 0;
        i++;
    }

    // Row 1: 8 Butterflies
    for (col = 0; col < 8; ++col) {
        enemies[i].active = 1;
        enemies[i].type = 1;
        enemies[i].hp = 1;
        enemies[i].targetX = 6 + col * 4;
        enemies[i].targetY = 6;
        enemies[i].curX = enemies[i].targetX;
        enemies[i].curY = enemies[i].targetY;
        enemies[i].state = 0;
        enemies[i].timer = 0;
        i++;
    }

    // Rows 2-3: 12 Bees
    for (row = 0; row < 2; ++row) {
        for (col = 0; col < 6; ++col) {
            enemies[i].active = 1;
            enemies[i].type = 0;
            enemies[i].hp = 1;
            enemies[i].targetX = 8 + col * 4;
            enemies[i].targetY = 8 + row * 2;
            enemies[i].curX = enemies[i].targetX;
            enemies[i].curY = enemies[i].targetY;
            enemies[i].state = 0;
            enemies[i].timer = 0;
            i++;
        }
    }

    drop.active = 0;
    formationNeedsRedraw = 1;
}

// Redraw enemies sitting in formation using custom 16x8 arcade tiles
void draw_formation(void) {
    unsigned char i;
    for (i = 0; i < MAX_ENEMIES; ++i) {
        if (enemies[i].active && enemies[i].state == 0) {
            unsigned char x = enemies[i].targetX + formationSway;
            unsigned char y = enemies[i].targetY;
            enemies[i].curX = x;
            enemies[i].curY = y;

            if (enemies[i].type == 2) {
                FAST_CHAR(x, y, CH_BOSS_L, (enemies[i].hp == 2) ? COLOR_LIGHTGREEN : COLOR_LIGHTBLUE);
                FAST_CHAR(x + 1, y, CH_BOSS_R, (enemies[i].hp == 2) ? COLOR_LIGHTGREEN : COLOR_LIGHTBLUE);
            } else if (enemies[i].type == 1) {
                FAST_CHAR(x, y, CH_BFLY_L, COLOR_LIGHTRED);
                FAST_CHAR(x + 1, y, CH_BFLY_R, COLOR_LIGHTRED);
            } else {
                FAST_CHAR(x, y, CH_BEE_L, COLOR_YELLOW);
                FAST_CHAR(x + 1, y, CH_BEE_R, COLOR_YELLOW);
            }
        }
    }
}

void clear_formation(void) {
    unsigned char i;
    for (i = 0; i < MAX_ENEMIES; ++i) {
        if (enemies[i].active && enemies[i].state == 0) {
            FAST_CLEAR(enemies[i].curX, enemies[i].curY);
            FAST_CLEAR(enemies[i].curX + 1, enemies[i].curY);
        }
    }
}

// -------------------------------------------------------------
// PLAYER VIC-II HARDWARE SPRITE UPDATES
// -------------------------------------------------------------

static unsigned char invulnerableTimer = 0;

void update_player_sprites(void) {
    unsigned char ena = 0x01; // Sprite 0 always active

    if (invulnerableTimer > 0) {
        invulnerableTimer--;
        if (invulnerableTimer & 2) {
            ena &= ~0x01; // Blink while respawning
        }
    }

    // Set Sprite 0 Position (Player Ship)
    POKE(VIC_SP0_X, playerPixelX & 0xFF);
    POKE(VIC_SP0_Y, playerPixelY);

    // Set MSB for Sprite 0
    if (playerPixelX > 255) {
        POKE(VIC_MSB_X, PEEK(VIC_MSB_X) | 0x01);
    } else {
        POKE(VIC_MSB_X, PEEK(VIC_MSB_X) & ~0x01);
    }

    // Shield Sprite 1
    if (playerShield > 0) {
        ena |= 0x02;
        POKE(VIC_SP1_X, (playerPixelX - 2) & 0xFF);
        POKE(VIC_SP1_Y, playerPixelY - 2);
        if ((playerPixelX - 2) > 255) {
            POKE(VIC_MSB_X, PEEK(VIC_MSB_X) | 0x02);
        } else {
            POKE(VIC_MSB_X, PEEK(VIC_MSB_X) & ~0x02);
        }
        POKE(VIC_SP1_COL, (tick & 2) ? COLOR_CYAN : COLOR_WHITE);
    }

    // Explosion Sprite 3
    if (explosionTimer > 0) {
        ena |= 0x08;
        explosionTimer--;
    }

    POKE(VIC_SP_ENA, ena);
}

// -------------------------------------------------------------
// SHOOTING
// -------------------------------------------------------------

void shoot_laser(void) {
    unsigned char i;
    unsigned char col = (playerPixelX - 24) / 8;
    sid_laser();

    if (playerWeapon == WPN_RAPID) {
        shootCooldown = 2;
        for (i = 0; i < MAX_PBULLETS - 1; i += 2) {
            if (!pBullets[i].active && !pBullets[i + 1].active) {
                pBullets[i].active = 1;
                pBullets[i].x = (col > 0) ? col - 1 : 0;
                pBullets[i].y = 21;
                pBullets[i + 1].active = 1;
                pBullets[i + 1].x = (col < 38) ? col + 1 : 38;
                pBullets[i + 1].y = 21;
                break;
            }
        }
    } else if (playerWeapon == WPN_MISSILE) {
        shootCooldown = 4;
        for (i = 0; i < MAX_PBULLETS; ++i) {
            if (!pBullets[i].active) {
                pBullets[i].active = 1;
                pBullets[i].x = col;
                pBullets[i].y = 21;
                break;
            }
        }
        for (i = 0; i < MAX_MISSILES; ++i) {
            if (!missiles[i].active) {
                missiles[i].active = 1;
                missiles[i].x = col;
                missiles[i].y = 21;
                missiles[i].type = 0;
                break;
            }
        }
    } else if (playerWeapon == WPN_HYPER) {
        shootCooldown = 4;
        for (i = 0; i < MAX_MISSILES - 1; i += 2) {
            if (!missiles[i].active && !missiles[i + 1].active) {
                missiles[i].active = 1;
                missiles[i].x = (col > 0) ? col - 1 : 0;
                missiles[i].y = 21;
                missiles[i].type = 1;
                missiles[i + 1].active = 1;
                missiles[i + 1].x = (col < 38) ? col + 1 : 38;
                missiles[i + 1].y = 21;
                missiles[i + 1].type = 1;
                break;
            }
        }
    } else { // NORMAL
        shootCooldown = 4;
        for (i = 0; i < MAX_PBULLETS; ++i) {
            if (!pBullets[i].active) {
                pBullets[i].active = 1;
                pBullets[i].x = col;
                pBullets[i].y = 21;
                break;
            }
        }
    }
}

// Spawn drop capsule
void check_drop(unsigned char x, unsigned char y) {
    if (!drop.active && (rand() % 3 == 0)) {
        drop.active = 1;
        drop.x = x;
        drop.y = y;
        switch (rand() % 4) {
            case 0: drop.type = 'R'; drop.color = COLOR_YELLOW; break;
            case 1: drop.type = 'M'; drop.color = COLOR_LIGHTRED; break;
            case 2: drop.type = 'H'; drop.color = COLOR_PURPLE; break;
            default: drop.type = 'S'; drop.color = COLOR_CYAN; break;
        }
    }
}

// -------------------------------------------------------------
// HUD
// -------------------------------------------------------------

void draw_hud(void) {
    char buf[12];
    unsigned int v;

    buf[0] = '1'; buf[1] = 'U'; buf[2] = 'P'; buf[3] = ':';
    v = score;
    buf[8] = '0' + (v % 10); v /= 10;
    buf[7] = '0' + (v % 10); v /= 10;
    buf[6] = '0' + (v % 10); v /= 10;
    buf[5] = '0' + (v % 10); v /= 10;
    buf[4] = '0' + (v % 10);
    buf[9] = 0;
    printText(1, 0, buf, COLOR_WHITE);

    buf[0] = 'H'; buf[1] = 'I'; buf[2] = 'G'; buf[3] = 'H'; buf[4] = ':';
    v = highScore;
    buf[9] = '0' + (v % 10); v /= 10;
    buf[8] = '0' + (v % 10); v /= 10;
    buf[7] = '0' + (v % 10); v /= 10;
    buf[6] = '0' + (v % 10); v /= 10;
    buf[5] = '0' + (v % 10);
    buf[10] = 0;
    printText(14, 0, buf, COLOR_YELLOW);

    buf[0] = 'L'; buf[1] = ':'; buf[2] = '0' + lives; buf[3] = 0;
    printText(32, 0, buf, COLOR_LIGHTGREEN);

    // Weapon
    switch (playerWeapon) {
        case WPN_RAPID:   printText(1, 1, "WPN:RAPID  ", COLOR_YELLOW); break;
        case WPN_MISSILE: printText(1, 1, "WPN:MISSILE", COLOR_LIGHTRED); break;
        case WPN_HYPER:   printText(1, 1, "WPN:HYPER  ", COLOR_PURPLE); break;
        default:          printText(1, 1, "WPN:LASER  ", COLOR_CYAN); break;
    }

    if (playerShield > 0) {
        printText(28, 1, "SHIELD:[]", COLOR_CYAN);
    } else {
        printText(28, 1, "         ", COLOR_BLACK);
    }
}

// -------------------------------------------------------------
// TRIGGER DIVING ALIEN
// -------------------------------------------------------------

void trigger_dive(void) {
    unsigned char i;
    for (i = 0; i < MAX_ENEMIES; ++i) {
        if (enemies[i].active && enemies[i].state == 0) {
            if ((rand() % 6) == 0) {
                FAST_CLEAR(enemies[i].curX, enemies[i].curY);
                FAST_CLEAR(enemies[i].curX + 1, enemies[i].curY);
                enemies[i].state = 1; // Diving
                enemies[i].timer = 0;
                break;
            }
        }
    }
}

// -------------------------------------------------------------
// TITLE SCREEN
// -------------------------------------------------------------

void title_screen(void) {
    clear_screen();

    printText(7, 3, "**** COMMODORE 64 GALAXY ****", COLOR_YELLOW);
    printText(11, 5, "MOS 6510 - VIC-II - SID", COLOR_CYAN);

    printText(11, 8, "- POINT VALUES -", COLOR_WHITE);

    // Show actual arcade graphics on title screen!
    FAST_CHAR(10, 10, CH_BEE_L, COLOR_YELLOW);
    FAST_CHAR(11, 10, CH_BEE_R, COLOR_YELLOW);
    printText(14, 10, "=  50 PTS", COLOR_YELLOW);

    FAST_CHAR(10, 12, CH_BFLY_L, COLOR_LIGHTRED);
    FAST_CHAR(11, 12, CH_BFLY_R, COLOR_LIGHTRED);
    printText(14, 12, "=  80 PTS", COLOR_LIGHTRED);

    FAST_CHAR(10, 14, CH_BOSS_L, COLOR_LIGHTGREEN);
    FAST_CHAR(11, 14, CH_BOSS_R, COLOR_LIGHTGREEN);
    printText(14, 14, "= 150 PTS", COLOR_LIGHTGREEN);

    printText(14, 16, "= FIGHTER", COLOR_WHITE);
    POKE(VIC_SP0_X, 24 + 10 * 8 + 4);
    POKE(VIC_SP0_Y, 50 + 16 * 8 - 4);
    POKE(VIC_MSB_X, 0);
    POKE(VIC_SP_ENA, 0x01);

    printText(7, 19, "CONTROLS: WASD / JOYSTICK 2", COLOR_CYAN);
    printText(9, 21, "FIRE: SPACE / JOY BUTTON", COLOR_CYAN);

    printText(6, 23, "PRESS SPACE OR FIRE TO START", COLOR_WHITE);

    while (1) {
        unsigned char joy = PEEK(CIA1_PRA);
        unsigned char k = PEEK(0x00C5);
        if (k == 60 || !(joy & 0x10)) { // Space or Joy Fire
            break;
        }
        if (kbhit()) {
            char ch = cgetc();
            if (ch == ' ' || ch == 13) break;
        }
    }

    clear_screen();
}

// -------------------------------------------------------------
// MAIN GAME LOOP
// -------------------------------------------------------------

int main(void) {
    unsigned char running;
    unsigned char i, ei;
    unsigned char joy;
    unsigned char key;

    init_c64_hardware();
    sid_init();

    while (1) {
        title_screen();

        running = 1;
        lives = 3;
        score = 0;
        stage = 1;
        playerWeapon = WPN_NORMAL;
        playerShield = 0;
        playerPixelX = 160;
        playerPixelY = 224;
        invulnerableTimer = 0;
        formationSway = 0;
        formationDir = 1;
        explosionTimer = 0;

        init_stars();
        init_formation();
        draw_hud();

        while (running) {
            tick++;

        // 1. Check Inputs (WASD + Joystick 2)
        joy = PEEK(CIA1_PRA);
        key = PEEK(0x00C5); // Kernal matrix key code

        // Left: 'A' (key 10) or Joy Left (bit 2)
        if (!(joy & 0x04) || key == 10) {
            if (playerPixelX > 32) playerPixelX -= 3;
        }
        // Right: 'D' (key 18) or Joy Right (bit 3)
        if (!(joy & 0x08) || key == 18) {
            if (playerPixelX < 312) playerPixelX += 3;
        }
        // Up: 'W' (key 9) or Joy Up (bit 0)
        if (!(joy & 0x01) || key == 9) {
            if (playerPixelY > 170) playerPixelY -= 2;
        }
        // Down: 'S' (key 13) or Joy Down (bit 1)
        if (!(joy & 0x02) || key == 13) {
            if (playerPixelY < 236) playerPixelY += 2;
        }

        // Fire: Space (key 60) or Joy Fire (bit 4)
        if (shootCooldown > 0) shootCooldown--;
        if ((!(joy & 0x10) || key == 60) && shootCooldown == 0) {
            shoot_laser();
        }

        if (kbhit()) {
            char ch = cgetc();
            if (ch == 'a' || ch == 'A') { if (playerPixelX > 32) playerPixelX -= 4; }
            else if (ch == 'd' || ch == 'D') { if (playerPixelX < 312) playerPixelX += 4; }
            else if (ch == 'w' || ch == 'W') { if (playerPixelY > 170) playerPixelY -= 3; }
            else if (ch == 's' || ch == 'S') { if (playerPixelY < 236) playerPixelY += 3; }
            else if (ch == ' ' && shootCooldown == 0) { shoot_laser(); }
        }

        // 2. Stars Background
        update_stars();

        // 3. Formation Swaying
        if (tick % 10 == 0) {
            clear_formation();
            formationSway += formationDir;
            if (formationSway >= 4) formationDir = -1;
            else if (formationSway <= 0) formationDir = 1;
            formationNeedsRedraw = 1;
        }

        if (formationNeedsRedraw) {
            draw_formation();
            formationNeedsRedraw = 0;
        }

        // 4. Trigger Diving Kamikaze Attacks (Balanced classic arcade pacing)
        if (tick > 100 && (tick % 110 == 0)) {
            trigger_dive();
        }

        // 5. Update Diving Enemies
        {
            unsigned char pCol = (playerPixelX - 24) / 8;
            unsigned char pRow = (playerPixelY - 50) / 8;

            for (i = 0; i < MAX_ENEMIES; ++i) {
                if (enemies[i].active && enemies[i].state == 1) { // Diving
                    FAST_CLEAR(enemies[i].curX, enemies[i].curY);
                    FAST_CLEAR(enemies[i].curX + 1, enemies[i].curY);

                    enemies[i].timer++;
                    if (enemies[i].timer % 3 == 0) {
                        enemies[i].curY++;
                    }

                    // Steer toward player horizontally at smooth cadence
                    if (enemies[i].timer % 4 == 0) {
                        if (enemies[i].curX < pCol) enemies[i].curX++;
                        else if (enemies[i].curX > pCol) enemies[i].curX--;
                    }

                    // Dive shot
                    if (enemies[i].timer == 8 && (rand() % 2 == 0)) {
                        for (ei = 0; ei < MAX_EBULLETS; ++ei) {
                            if (!eBullets[ei].active) {
                                eBullets[ei].active = 1;
                                eBullets[ei].x = enemies[i].curX;
                                eBullets[ei].y = enemies[i].curY + 1;
                                break;
                            }
                        }
                    }

                    // Bottom reached: loop back to top
                    if (enemies[i].curY >= 24) {
                        enemies[i].curY = 2;
                        enemies[i].state = 0;
                        formationNeedsRedraw = 1;
                        continue;
                    }

                    // Redraw diving enemy
                    if (enemies[i].type == 2) {
                        FAST_CHAR(enemies[i].curX, enemies[i].curY, CH_BOSS_L, COLOR_LIGHTGREEN);
                        FAST_CHAR(enemies[i].curX + 1, enemies[i].curY, CH_BOSS_R, COLOR_LIGHTGREEN);
                    } else if (enemies[i].type == 1) {
                        FAST_CHAR(enemies[i].curX, enemies[i].curY, CH_BFLY_L, COLOR_LIGHTRED);
                        FAST_CHAR(enemies[i].curX + 1, enemies[i].curY, CH_BFLY_R, COLOR_LIGHTRED);
                    } else {
                        FAST_CHAR(enemies[i].curX, enemies[i].curY, CH_BEE_L, COLOR_YELLOW);
                        FAST_CHAR(enemies[i].curX + 1, enemies[i].curY, CH_BEE_R, COLOR_YELLOW);
                    }

                    // Direct Ship Collision check with diving alien!
                    if (invulnerableTimer == 0 &&
                        enemies[i].curY >= pRow - 1 && enemies[i].curY <= pRow + 1 &&
                        enemies[i].curX + 1 >= pCol && enemies[i].curX <= pCol + 2) {

                        FAST_CLEAR(enemies[i].curX, enemies[i].curY);
                        FAST_CLEAR(enemies[i].curX + 1, enemies[i].curY);
                        enemies[i].active = 0;

                        if (playerShield > 0) {
                            playerShield--;
                            sid_shield();
                            draw_hud();
                        } else {
                            sid_explode();
                            // Trigger explosion sprite
                            POKE(VIC_SP3_X, playerPixelX & 0xFF);
                            POKE(VIC_SP3_Y, playerPixelY);
                            explosionTimer = 25;
                            lives--;
                            playerWeapon = WPN_NORMAL;
                            invulnerableTimer = 60; // 1.2s invulnerability
                            playerPixelX = 160;
                            playerPixelY = 224;
                            draw_hud();
                            if (lives == 0) {
                                running = 0;
                            }
                        }
                    }
                }
            }
        }

        // 6. Update Player Bullets
        for (i = 0; i < MAX_PBULLETS; ++i) {
            if (!pBullets[i].active) continue;
            FAST_CLEAR(pBullets[i].x, pBullets[i].y);
            if (pBullets[i].y > 2) {
                pBullets[i].y--;
                FAST_CHAR(pBullets[i].x, pBullets[i].y, CH_PBULLET, COLOR_YELLOW);

                // Collision with enemies
                for (ei = 0; ei < MAX_ENEMIES; ++ei) {
                    if (enemies[ei].active &&
                        pBullets[i].y == enemies[ei].curY &&
                        pBullets[i].x >= enemies[ei].curX &&
                        pBullets[i].x <= enemies[ei].curX + 1) {

                        enemies[ei].hp--;
                        pBullets[i].active = 0;
                        FAST_CLEAR(pBullets[i].x, pBullets[i].y);

                        if (enemies[ei].hp == 0) {
                            FAST_CLEAR(enemies[ei].curX, enemies[ei].curY);
                            FAST_CLEAR(enemies[ei].curX + 1, enemies[ei].curY);
                            enemies[ei].active = 0;

                            sid_explode();
                            score += (enemies[ei].type == 2) ? 150 : ((enemies[ei].type == 1) ? 80 : 50);
                            check_drop(enemies[ei].curX, enemies[ei].curY);
                            draw_hud();
                        } else {
                            sid_laser();
                        }
                        break;
                    }
                }
            } else {
                pBullets[i].active = 0;
            }
        }

        // 7. Update Missiles
        for (i = 0; i < MAX_MISSILES; ++i) {
            if (!missiles[i].active) continue;
            FAST_CLEAR(missiles[i].x, missiles[i].y);
            if (missiles[i].y > 2) {
                missiles[i].y--;
                if (missiles[i].type == 0) { // Homing
                    for (ei = 0; ei < MAX_ENEMIES; ++ei) {
                        if (enemies[ei].active) {
                            if (missiles[i].x < enemies[ei].curX) missiles[i].x++;
                            else if (missiles[i].x > enemies[ei].curX) missiles[i].x--;
                            break;
                        }
                    }
                }
                FAST_CHAR(missiles[i].x, missiles[i].y, CH_PBULLET, COLOR_LIGHTRED);

                // Collision
                for (ei = 0; ei < MAX_ENEMIES; ++ei) {
                    if (enemies[ei].active &&
                        missiles[i].y == enemies[ei].curY &&
                        missiles[i].x >= enemies[ei].curX &&
                        missiles[i].x <= enemies[ei].curX + 1) {

                        FAST_CLEAR(enemies[ei].curX, enemies[ei].curY);
                        FAST_CLEAR(enemies[ei].curX + 1, enemies[ei].curY);
                        enemies[ei].active = 0;
                        missiles[i].active = 0;
                        FAST_CLEAR(missiles[i].x, missiles[i].y);
                        sid_explode();
                        score += 120;
                        check_drop(enemies[ei].curX, enemies[ei].curY);
                        draw_hud();
                        break;
                    }
                }
            } else {
                missiles[i].active = 0;
            }
        }

        // 8. Update Enemy Bullets
        {
            unsigned char pCol = (playerPixelX - 24) / 8;
            unsigned char pRow = (playerPixelY - 50) / 8;

            for (i = 0; i < MAX_EBULLETS; ++i) {
                if (!eBullets[i].active) continue;
                FAST_CLEAR(eBullets[i].x, eBullets[i].y);
                if (eBullets[i].y < 24) {
                    eBullets[i].y++;
                    FAST_CHAR(eBullets[i].x, eBullets[i].y, CH_EBULLET, COLOR_LIGHTRED);

                    // Hit player
                    if (invulnerableTimer == 0 &&
                        eBullets[i].y == pRow && eBullets[i].x >= pCol && eBullets[i].x <= pCol + 2) {
                        eBullets[i].active = 0;
                        FAST_CLEAR(eBullets[i].x, eBullets[i].y);

                        if (playerShield > 0) {
                            playerShield--;
                            sid_shield();
                            draw_hud();
                        } else {
                            sid_explode();
                            POKE(VIC_SP3_X, playerPixelX & 0xFF);
                            POKE(VIC_SP3_Y, playerPixelY);
                            explosionTimer = 25;
                            lives--;
                            playerWeapon = WPN_NORMAL;
                            invulnerableTimer = 60;
                            playerPixelX = 160;
                            playerPixelY = 224;
                            draw_hud();
                            if (lives == 0) {
                                running = 0;
                            }
                        }
                    }
                } else {
                    eBullets[i].active = 0;
                }
            }
        }

        // 9. Update Drop Capsule
        if (drop.active) {
            unsigned char pCol = (playerPixelX - 24) / 8;
            unsigned char pRow = (playerPixelY - 50) / 8;

            FAST_CLEAR(drop.x, drop.y);
            FAST_CLEAR(drop.x + 1, drop.y);
            if (tick % 3 == 0) drop.y++;
            if (drop.y < 24) {
                FAST_CHAR(drop.x, drop.y, CH_CAPSULE_L, drop.color);
                FAST_CHAR(drop.x + 1, drop.y, CH_CAPSULE_R, drop.color);

                // Pickup by player
                if (drop.y == pRow && drop.x >= pCol - 1 && drop.x <= pCol + 2) {
                    sid_powerup();
                    if (drop.type == 'S') {
                        playerShield = 2;
                    } else if (drop.type == 'R') {
                        playerWeapon = WPN_RAPID;
                    } else if (drop.type == 'M') {
                        playerWeapon = WPN_MISSILE;
                    } else if (drop.type == 'H') {
                        playerWeapon = WPN_HYPER;
                    }
                    score += 200;
                    drop.active = 0;
                    FAST_CLEAR(drop.x, drop.y);
                    FAST_CLEAR(drop.x + 1, drop.y);
                    draw_hud();
                }
            } else {
                drop.active = 0;
            }
        }

        // 10. Update Player Sprites (VIC-II Hardware MOBs)
        update_player_sprites();

        // 11. Check Wave Cleared
        {
            unsigned char remaining = 0;
            for (i = 0; i < MAX_ENEMIES; ++i) {
                if (enemies[i].active) remaining++;
            }
            if (remaining == 0) {
                stage++;
                sid_powerup();
                init_formation();
                draw_hud();
            }
        }

        // 12. Smooth Raster Synchronization (Snappy 50Hz arcade pace)
        while (PEEK(VIC_RASTER) < 250);
        while (PEEK(VIC_RASTER) >= 250);
    }

    // GAME OVER
    POKE(VIC_SP_ENA, 0x00); // Turn off sprites
    printText(15, 12, "GAME OVER", COLOR_RED);
    printText(9, 14, "PRESS FIRE TO RESTART", COLOR_WHITE);
    for (i = 0; i < 40; ++i) {
        while (PEEK(VIC_RASTER) < 250);
        while (PEEK(VIC_RASTER) >= 250);
    }
    while (1) {
        joy = PEEK(CIA1_PRA);
        key = PEEK(0x00C5);
        if (!(joy & 0x10) || key == 60) break;
        if (kbhit()) {
            char ch = cgetc();
            if (ch == ' ' || ch == 13) break;
        }
    }
    }

    return 0;
}
