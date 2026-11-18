/**
 * GALAXY - Full VIC-II Hardware Sprite & Custom Charset Edition for Commodore 64
 * MOS 6510 • 8 VIC-II Hardware MOBs • Hardware Collision Registers • SID 6581 Audio
 * (C) 2026 Retro Gaming Project
 */

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
#define SP0_PTR         0x63F8 // Player
#define SP1_PTR         0x63F9 // Shield
#define SP2_PTR         0x63FA // Laser 1
#define SP3_PTR         0x63FB // Laser 2
#define SP4_PTR         0x63FC // Diving Boss
#define SP5_PTR         0x63FD // Diving Bee
#define SP6_PTR         0x63FE // Enemy Bomb
#define SP7_PTR         0x63FF // Explosion

// Sprite Block numbers relative to Bank 1 ($4000)
// ($7000 - $4000) / 64 = 12288 / 64 = 192
#define BLOCK_PLAYER    192 // $7000
#define BLOCK_SHIELD    193 // $7040
#define BLOCK_LASER1    194 // $7080
#define BLOCK_LASER2    195 // $70C0
#define BLOCK_BOSS      196 // $7100
#define BLOCK_BEE       197 // $7140
#define BLOCK_EBOMB     198 // $7180
#define BLOCK_EXP       199 // $71C0

// VIC-II Hardware Registers
#define VIC_SP0_X       0xD000
#define VIC_SP0_Y       0xD001
#define VIC_SP1_X       0xD002
#define VIC_SP1_Y       0xD003
#define VIC_SP2_X       0xD004
#define VIC_SP2_Y       0xD005
#define VIC_SP3_X       0xD006
#define VIC_SP3_Y       0xD007
#define VIC_SP4_X       0xD008
#define VIC_SP4_Y       0xD009
#define VIC_SP5_X       0xD00A
#define VIC_SP5_Y       0xD00B
#define VIC_SP6_X       0xD00C
#define VIC_SP6_Y       0xD00D
#define VIC_SP7_X       0xD00E
#define VIC_SP7_Y       0xD00F

#define VIC_MSB_X       0xD010
#define VIC_CTRL1       0xD011
#define VIC_RASTER      0xD012
#define VIC_SP_ENA      0xD015
#define VIC_CTRL2       0xD016
#define VIC_SP_EXP_Y    0xD017
#define VIC_MEM_PTR     0xD018
#define VIC_SP_EXP_X    0xD01D
#define VIC_SP_SP_COL   0xD01E // Hardware Sprite-to-Sprite Collision
#define VIC_SP_BG_COL   0xD01F // Hardware Sprite-to-Background Collision
#define VIC_BORDER      0xD020
#define VIC_BG0         0xD021
#define VIC_SP_COL_MC   0xD01C
#define VIC_SP0_COL     0xD027
#define VIC_SP1_COL     0xD028
#define VIC_SP2_COL     0xD029
#define VIC_SP3_COL     0xD02A
#define VIC_SP4_COL     0xD02B
#define VIC_SP5_COL     0xD02C
#define VIC_SP6_COL     0xD02D
#define VIC_SP7_COL     0xD02E

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

// Custom Character Codes (Characters 64..73) for Formation and Stars
#define CH_BEE_L        64
#define CH_BEE_R        65
#define CH_BFLY_L       66
#define CH_BFLY_R       67
#define CH_BOSS_L       68
#define CH_BOSS_R       69
#define CH_STAR1        70
#define CH_STAR2        71
#define CH_CAP_L        72
#define CH_CAP_R        73

// Weapon types
#define WPN_NORMAL      0
#define WPN_RAPID       1
#define WPN_MISSILE     2
#define WPN_HYPER       3

#define MAX_ENEMIES     24
#define MAX_STARS       8

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

// Ultra-fast 8-bit Galois LFSR PRNG (8 clock cycles vs 1200 cycles in stdlib rand)
static unsigned char rng_seed = 0x5A;
static unsigned char fast_rnd(void) {
    rng_seed = (rng_seed >> 1) ^ (-(rng_seed & 1) & 0xB8);
    return rng_seed;
}

// -------------------------------------------------------------
// 8 HARDWARE SPRITE BITMAPS (64 bytes each = 512 bytes total)
// -------------------------------------------------------------

// Sprite 0: Player Ship (24x21 high-res)
static const unsigned char sp_player[64] = {
    0x00, 0x18, 0x00, 0x00, 0x18, 0x00, 0x00, 0x3C, 0x00, 0x00, 0x3C, 0x00,
    0x00, 0x7E, 0x00, 0x00, 0xFF, 0x00, 0x01, 0xFF, 0x80, 0x03, 0xBD, 0xC0,
    0x07, 0xBD, 0xE0, 0x0F, 0xFF, 0xF0, 0x1F, 0xE7, 0xF8, 0x3F, 0xC3, 0xFC,
    0x7F, 0x81, 0xFE, 0xFF, 0x18, 0xFF, 0xFF, 0x3C, 0xFF, 0x7F, 0xFF, 0xFE,
    0x3C, 0x7E, 0x3C, 0x18, 0x3C, 0x18, 0x00, 0x18, 0x00, 0x00, 0x18, 0x00,
    0x00, 0x00, 0x00, 0x00
};

// Sprite 1: Shield Force Field (24x21)
static const unsigned char sp_shield[64] = {
    0x03, 0xFF, 0xC0, 0x0F, 0xFF, 0xF0, 0x1E, 0x00, 0x78, 0x3C, 0x00, 0x3C,
    0x78, 0x00, 0x1E, 0x70, 0x00, 0x0E, 0xE0, 0x00, 0x07, 0xE0, 0x00, 0x07,
    0xC0, 0x00, 0x03, 0xC0, 0x00, 0x03, 0xC0, 0x00, 0x03, 0xC0, 0x00, 0x03,
    0xC0, 0x00, 0x03, 0xE0, 0x00, 0x07, 0xE0, 0x00, 0x07, 0x70, 0x00, 0x0E,
    0x78, 0x00, 0x1E, 0x3C, 0x00, 0x3C, 0x1E, 0x00, 0x78, 0x0F, 0xFF, 0xF0,
    0x03, 0xFF, 0xC0, 0x00
};

// Sprite 2 & 3: Player Lasers / Missiles (24x21)
static const unsigned char sp_laser[64] = {
    0x00, 0x18, 0x00, 0x00, 0x3C, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x7E, 0x00,
    0x00, 0x7E, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x7E, 0x00,
    0x00, 0x7E, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x3C, 0x00, 0x00, 0x18, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
};

// Sprite 4: Diving Boss Galaga (24x21)
static const unsigned char sp_boss[64] = {
    0x06, 0x00, 0x60, 0x0F, 0x00, 0xF0, 0x1F, 0x81, 0xF8, 0x1F, 0xC3, 0xF8,
    0x3E, 0x66, 0x7C, 0x3E, 0x7E, 0x7C, 0x7F, 0xFF, 0xFE, 0x7F, 0xFF, 0xFE,
    0xFF, 0x99, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0x00, 0xFF, 0x7F, 0xDB, 0xFE,
    0x7F, 0xFF, 0xFE, 0x3F, 0xFF, 0xFC, 0x1F, 0xFF, 0xF8, 0x0F, 0xC3, 0xF0,
    0x07, 0x81, 0xE0, 0x03, 0x00, 0xC0, 0x03, 0x00, 0xC0, 0x01, 0x00, 0x80,
    0x00, 0x00, 0x00, 0x00
};

// Sprite 5: Diving Bee / Butterfly (24x21)
static const unsigned char sp_bee[64] = {
    0x03, 0x00, 0xC0, 0x07, 0x81, 0xE0, 0x0F, 0xC3, 0xF0, 0x1F, 0xE7, 0xF8,
    0x3F, 0xFF, 0xFC, 0x7F, 0xBD, 0xFE, 0xFF, 0x18, 0xFF, 0xFF, 0x18, 0xFF,
    0x7F, 0xFF, 0xFE, 0x3F, 0xFF, 0xFC, 0x1F, 0xBD, 0xF8, 0x0F, 0xBD, 0xF0,
    0x07, 0xFF, 0xE0, 0x03, 0xFF, 0xC0, 0x01, 0xE7, 0x80, 0x00, 0xC3, 0x00,
    0x00, 0x81, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
};

// Sprite 6: Enemy Bomb / Dart (24x21)
static const unsigned char sp_ebomb[64] = {
    0x00, 0x18, 0x00, 0x00, 0x3C, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x7E, 0x00,
    0x00, 0x3C, 0x00, 0x00, 0x18, 0x00, 0x00, 0x18, 0x00, 0x00, 0x18, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
};

// Sprite 7: Explosion Fireball (24x21)
static const unsigned char sp_exp[64] = {
    0x00, 0x18, 0x00, 0x01, 0xBD, 0x80, 0x07, 0xBD, 0xE0, 0x0E, 0x7E, 0x70,
    0x1C, 0xFF, 0x38, 0x39, 0xDB, 0x9C, 0x7B, 0x81, 0xDE, 0x67, 0x00, 0xE6,
    0xCF, 0x00, 0xF3, 0xDE, 0x00, 0x7B, 0xDE, 0x00, 0x7B, 0xCF, 0x00, 0xF3,
    0x67, 0x00, 0xE6, 0x7B, 0x81, 0xDE, 0x39, 0xDB, 0x9C, 0x1C, 0xFF, 0x38,
    0x0E, 0x7E, 0x70, 0x07, 0xBD, 0xE0, 0x01, 0xBD, 0x80, 0x00, 0x18, 0x00,
    0x00, 0x00, 0x00, 0x00
};

// Custom Character Set Bitmaps for Formation Aliens
static const unsigned char custom_tiles[10][8] = {
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
    // 8: Capsule Left (CH_CAP_L)
    { 0x3C, 0x7E, 0x66, 0x7E, 0x66, 0x66, 0x7E, 0x3C },
    // 9: Capsule Right (CH_CAP_R)
    { 0x3C, 0x7E, 0x66, 0x7E, 0x66, 0x66, 0x7E, 0x3C }
};

// -------------------------------------------------------------
// HARDWARE INITIALIZATION
// -------------------------------------------------------------

void init_c64_hardware(void) {
    unsigned char orig_port;
    unsigned int i;

    // 1. Copy ROM character font to $6800 with SEI/CLI
    asm("sei");
    orig_port = PEEK(0x01);
    POKE(0x01, orig_port & ~0x04);
    for (i = 0; i < 2048; ++i) {
        POKE(CHARSET_BASE + i, PEEK(0xD000 + i));
    }
    POKE(0x01, orig_port);
    asm("cli");

    // 2. Inject custom arcade tiles into characters 64..73
    for (i = 0; i < 10; ++i) {
        memcpy((void*)(CHARSET_BASE + (64 + i) * 8), custom_tiles[i], 8);
    }

    // 3. Load all 8 VIC-II Hardware Sprites into Bank 1 ($7000-$71FF)
    memcpy((void*)0x7000, sp_player, 64); // SP0: Player
    memcpy((void*)0x7040, sp_shield, 64); // SP1: Shield
    memcpy((void*)0x7080, sp_laser, 64);  // SP2: Laser 1
    memcpy((void*)0x70C0, sp_laser, 64);  // SP3: Laser 2
    memcpy((void*)0x7100, sp_boss, 64);   // SP4: Diving Boss
    memcpy((void*)0x7140, sp_bee, 64);    // SP5: Diving Bee
    memcpy((void*)0x7180, sp_ebomb, 64);  // SP6: Enemy Bomb
    memcpy((void*)0x71C0, sp_exp, 64);    // SP7: Explosion

    // 4. Switch VIC-II to Bank 1 ($4000-$7FFF)
    POKE(CIA2_DDRA, PEEK(CIA2_DDRA) | 0x03);
    POKE(CIA2_PRA, (PEEK(CIA2_PRA) & ~0x03) | 0x02);

    // 5. Register $D018: Screen at $6000 (bits 7-4 = 8), Chargen at $6800 (bits 3-1 = 5)
    POKE(VIC_MEM_PTR, 0x8A);

    // 6. Setup Sprite Pointers in Screen RAM ($63F8-$63FF)
    POKE(SP0_PTR, BLOCK_PLAYER);
    POKE(SP1_PTR, BLOCK_SHIELD);
    POKE(SP2_PTR, BLOCK_LASER1);
    POKE(SP3_PTR, BLOCK_LASER2);
    POKE(SP4_PTR, BLOCK_BOSS);
    POKE(SP5_PTR, BLOCK_BEE);
    POKE(SP6_PTR, BLOCK_EBOMB);
    POKE(SP7_PTR, BLOCK_EXP);

    // 7. Setup Sprite Colors
    POKE(VIC_SP0_COL, COLOR_WHITE);
    POKE(VIC_SP1_COL, COLOR_CYAN);
    POKE(VIC_SP2_COL, COLOR_YELLOW);
    POKE(VIC_SP3_COL, COLOR_YELLOW);
    POKE(VIC_SP4_COL, COLOR_LIGHTGREEN);
    POKE(VIC_SP5_COL, COLOR_YELLOW);
    POKE(VIC_SP6_COL, COLOR_LIGHTRED);
    POKE(VIC_SP7_COL, COLOR_YELLOW);

    POKE(VIC_SP_COL_MC, 0x00); // Standard high-res sprites
    POKE(VIC_SP_EXP_X, 0x00);  // Normal size
    POKE(VIC_SP_EXP_Y, 0x00);

    POKE(VIC_BORDER, COLOR_BLUE);
    POKE(VIC_BG0, COLOR_BLACK);
}

// -------------------------------------------------------------
// SID 6581 AUDIO
// -------------------------------------------------------------

void sid_init(void) {
    unsigned char i;
    for (i = 0; i < 25; ++i) POKE(SID_BASE + i, 0);
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
// TEXT & SCREEN
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
// GAME STATE & GLOBALS
// -------------------------------------------------------------

// Player
static unsigned int playerPixelX = 160;
static unsigned char playerPixelY = 224;
static unsigned char lives = 3;
static unsigned int score = 0;
static unsigned int highScore = 10000;
static unsigned char stage = 1;
static unsigned char playerShield = 0;
static unsigned char playerWeapon = WPN_NORMAL;
static unsigned char shootCooldown = 0;
static unsigned char invulnerableTimer = 0;

// Player Hardware Lasers (Sprites 2 & 3)
static unsigned char l1_active = 0;
static unsigned int  l1_x = 0;
static unsigned char l1_y = 0;

static unsigned char l2_active = 0;
static unsigned int  l2_x = 0;
static unsigned char l2_y = 0;

// Diving Enemies (Sprites 4 & 5)
static unsigned char d1_active = 0;
static unsigned int  d1_x = 0;
static unsigned char d1_y = 0;
static signed char   d1_dx = 0;
static unsigned char d1_type = 2; // Boss

static unsigned char d2_active = 0;
static unsigned int  d2_x = 0;
static unsigned char d2_y = 0;
static signed char   d2_dx = 0;
static unsigned char d2_type = 0; // Bee

// Enemy Bomb (Sprite 6)
static unsigned char eb_active = 0;
static unsigned int  eb_x = 0;
static unsigned char eb_y = 0;

// Explosion (Sprite 7)
static unsigned char exp_active = 0;
static unsigned int  exp_x = 0;
static unsigned char exp_y = 0;
static unsigned char exp_timer = 0;

// Formation in background
typedef struct {
    unsigned char active;
    unsigned char type; // 0=Bee, 1=Butterfly, 2=Boss
    unsigned char hp;
    unsigned char origCol;
    unsigned char origRow;
} EnemyTile;

static EnemyTile enemies[MAX_ENEMIES];
static unsigned char formationSway = 0;
static signed char formationDir = 1;
static unsigned char formationNeedsRedraw = 1;

// Running count of alive formation enemies (avoids an O(24) scan
// every frame to detect a cleared wave).
static unsigned char enemiesRemaining = 0;

// Per-row lookup for laser-vs-formation collision: formation rows are
// char rows 4, 6, 8, 10 and enemies are filled contiguously per row,
// so [row_start[rg], row_start[rg] + row_count[rg]) covers that row.
static const unsigned char row_orig[4] = {4, 6, 8, 10};
static unsigned char row_start[4];
static unsigned char row_count[4];

// Stars (8 lightweight stars)
static unsigned char star_x[MAX_STARS];
static unsigned char star_y[MAX_STARS];

// -------------------------------------------------------------
// STARS & FORMATION
// -------------------------------------------------------------

void init_stars(void) {
    unsigned char i;
    for (i = 0; i < MAX_STARS; ++i) {
        star_x[i] = (fast_rnd() % 38) + 1;
        star_y[i] = (fast_rnd() % 22) + 2;
        FAST_CHAR(star_x[i], star_y[i], (i & 1) ? CH_STAR1 : CH_STAR2, COLOR_WHITE);
    }
}

void init_formation(void) {
    unsigned char col, row, i = 0;

    // Row 4: 4 Bosses
    for (col = 0; col < 4; ++col) {
        enemies[i].active = 1;
        enemies[i].type = 2;
        enemies[i].hp = 2;
        enemies[i].origCol = 11 + col * 5;
        enemies[i].origRow = 4;
        i++;
    }

    // Row 6: 8 Butterflies
    for (col = 0; col < 8; ++col) {
        enemies[i].active = 1;
        enemies[i].type = 1;
        enemies[i].hp = 1;
        enemies[i].origCol = 6 + col * 4;
        enemies[i].origRow = 6;
        i++;
    }

    // Rows 8 & 10: 12 Bees
    for (row = 0; row < 2; ++row) {
        for (col = 0; col < 6; ++col) {
            enemies[i].active = 1;
            enemies[i].type = 0;
            enemies[i].hp = 1;
            enemies[i].origCol = 8 + col * 4;
            enemies[i].origRow = 8 + row * 2;
            i++;
        }
    }

    enemiesRemaining = MAX_ENEMIES;

    // Build per-row lookup for the laser-vs-formation collision.
    for (row = 0; row < 4; ++row) { row_start[row] = MAX_ENEMIES; row_count[row] = 0; }
    for (i = 0; i < MAX_ENEMIES; ++i) {
        unsigned char rg = (enemies[i].origRow - 4) / 2;
        if (rg < 4) {
            if (row_start[rg] == MAX_ENEMIES) row_start[rg] = i;
            row_count[rg]++;
        }
    }

    formationNeedsRedraw = 1;
}

static void draw_enemy_side(unsigned char x, unsigned char y, const EnemyTile *e, unsigned char right) {
    if (e->type == 2) {
        unsigned char col = (e->hp == 2) ? COLOR_LIGHTGREEN : COLOR_LIGHTBLUE;
        FAST_CHAR(x, y, right ? CH_BOSS_R : CH_BOSS_L, col);
    } else if (e->type == 1) {
        FAST_CHAR(x, y, right ? CH_BFLY_R : CH_BFLY_L, COLOR_LIGHTRED);
    } else {
        FAST_CHAR(x, y, right ? CH_BEE_R : CH_BEE_L, COLOR_YELLOW);
    }
}

void draw_formation(void) {
    unsigned char i;
    for (i = 0; i < MAX_ENEMIES; ++i) {
        if (enemies[i].active) {
            unsigned char x = enemies[i].origCol + formationSway;
            unsigned char y = enemies[i].origRow;
            draw_enemy_side(x, y, &enemies[i], 0);
            draw_enemy_side(x + 1, y, &enemies[i], 1);
        }
    }
}

// Incremental sway: the formation moves +/-1 char per redraw, so only
// the vacated column and the newly-covered column change per enemy
// (the middle column just swaps its L/R half-tile). 5 POKEs per enemy
// instead of 6 (clear 2 + draw 4).
static void shift_formation(void) {
    unsigned char i;
    signed char ns = formationSway + formationDir;
    for (i = 0; i < MAX_ENEMIES; ++i) {
        if (enemies[i].active) {
            unsigned char y = enemies[i].origRow;
            unsigned char oc = enemies[i].origCol;
            if (formationDir > 0) {
                FAST_CLEAR(oc + formationSway, y);              // vacated left edge
                draw_enemy_side(oc + ns, y, &enemies[i], 0);    // middle: R -> L
                draw_enemy_side(oc + ns + 1, y, &enemies[i], 1);// new right edge
            } else {
                FAST_CLEAR(oc + formationSway + 1, y);          // vacated right edge
                draw_enemy_side(oc + ns, y, &enemies[i], 0);    // new left edge
                draw_enemy_side(oc + ns + 1, y, &enemies[i], 1);// middle: L -> R
            }
        }
    }
    formationSway = ns;
    if (formationSway >= 4) formationDir = -1;
    else if (formationSway <= 0) formationDir = 1;
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

    switch (playerWeapon) {
        case WPN_RAPID:   printText(1, 1, "WPN:RAPID  ", COLOR_YELLOW); break;
        case WPN_MISSILE: printText(1, 1, "WPN:MISSILE", COLOR_LIGHTRED); break;
        case WPN_HYPER:   printText(1, 1, "WPN:HYPER  ", COLOR_PURPLE); break;
        default:          printText(1, 1, "WPN:LASER  ", COLOR_CYAN); break;
    }

    if (playerShield > 0) printText(28, 1, "SHIELD:[]", COLOR_CYAN);
    else printText(28, 1, "         ", COLOR_BLACK);
}

// -------------------------------------------------------------
// HARDWARE SPRITE SYNC & REFRESH (Zero screen writes!)
// -------------------------------------------------------------

void sync_hardware_sprites(void) {
    unsigned char ena = 0x00;
    unsigned char msb = 0x00;

    // Sprite 0: Player
    if (invulnerableTimer == 0 || !(invulnerableTimer & 2)) {
        ena |= 0x01;
        POKE(VIC_SP0_X, playerPixelX & 0xFF);
        POKE(VIC_SP0_Y, playerPixelY);
        if (playerPixelX > 255) msb |= 0x01;
    }

    // Sprite 1: Shield Aura
    if (playerShield > 0) {
        ena |= 0x02;
        POKE(VIC_SP1_X, playerPixelX & 0xFF);
        POKE(VIC_SP1_Y, playerPixelY);
        if (playerPixelX > 255) msb |= 0x02;
    }

    // Sprite 2: Laser 1
    if (l1_active) {
        ena |= 0x04;
        POKE(VIC_SP2_X, l1_x & 0xFF);
        POKE(VIC_SP2_Y, l1_y);
        if (l1_x > 255) msb |= 0x04;
    }

    // Sprite 3: Laser 2
    if (l2_active) {
        ena |= 0x08;
        POKE(VIC_SP3_X, l2_x & 0xFF);
        POKE(VIC_SP3_Y, l2_y);
        if (l2_x > 255) msb |= 0x08;
    }

    // Sprite 4: Diving Boss
    if (d1_active) {
        ena |= 0x10;
        POKE(VIC_SP4_X, d1_x & 0xFF);
        POKE(VIC_SP4_Y, d1_y);
        if (d1_x > 255) msb |= 0x10;
    }

    // Sprite 5: Diving Bee
    if (d2_active) {
        ena |= 0x20;
        POKE(VIC_SP5_X, d2_x & 0xFF);
        POKE(VIC_SP5_Y, d2_y);
        if (d2_x > 255) msb |= 0x20;
    }

    // Sprite 6: Enemy Bomb
    if (eb_active) {
        ena |= 0x40;
        POKE(VIC_SP6_X, eb_x & 0xFF);
        POKE(VIC_SP6_Y, eb_y);
        if (eb_x > 255) msb |= 0x40;
    }

    // Sprite 7: Explosion
    if (exp_active) {
        ena |= 0x80;
        POKE(VIC_SP7_X, exp_x & 0xFF);
        POKE(VIC_SP7_Y, exp_y);
        if (exp_x > 255) msb |= 0x80;
    }

    POKE(VIC_MSB_X, msb);
    POKE(VIC_SP_ENA, ena);
}

// -------------------------------------------------------------
// PLAYER SHOOTING
// -------------------------------------------------------------

void shoot_laser(void) {
    sid_laser();
    if (playerWeapon == WPN_RAPID || playerWeapon == WPN_HYPER) {
        shootCooldown = 6;
        l1_active = 1; l1_x = playerPixelX - 6; l1_y = playerPixelY - 12;
        l2_active = 1; l2_x = playerPixelX + 6; l2_y = playerPixelY - 12;
    } else {
        shootCooldown = 8;
        l1_active = 1; l1_x = playerPixelX; l1_y = playerPixelY - 12;
    }
}

// -------------------------------------------------------------
// TRIGGER DIVING ENEMY
// -------------------------------------------------------------

void trigger_dive(void) {
    unsigned char i;
    if (!d1_active) {
        // Pick active boss
        for (i = 0; i < 4; ++i) {
            if (enemies[i].active) {
                enemies[i].active = 0;
                enemiesRemaining--;
                FAST_CLEAR(enemies[i].origCol + formationSway, enemies[i].origRow);
                FAST_CLEAR(enemies[i].origCol + formationSway + 1, enemies[i].origRow);
                d1_active = 1;
                d1_x = 24 + (enemies[i].origCol + formationSway) * 8;
                d1_y = 50 + enemies[i].origRow * 8;
                d1_dx = (d1_x < playerPixelX) ? 1 : -1;
                d1_type = 2;
                return;
            }
        }
    }

    if (!d2_active) {
        // Pick active bee or butterfly
        for (i = 4; i < MAX_ENEMIES; ++i) {
            if (enemies[i].active) {
                enemies[i].active = 0;
                enemiesRemaining--;
                FAST_CLEAR(enemies[i].origCol + formationSway, enemies[i].origRow);
                FAST_CLEAR(enemies[i].origCol + formationSway + 1, enemies[i].origRow);
                d2_active = 1;
                d2_x = 24 + (enemies[i].origCol + formationSway) * 8;
                d2_y = 50 + enemies[i].origRow * 8;
                d2_dx = (d2_x < playerPixelX) ? 1 : -1;
                d2_type = enemies[i].type;
                return;
            }
        }
    }
}

// -------------------------------------------------------------
// TRIGGER EXPLOSION
// -------------------------------------------------------------

void trigger_explosion(unsigned int x, unsigned char y) {
    sid_explode();
    exp_active = 1;
    exp_x = x;
    exp_y = y;
    exp_timer = 16;
}

// -------------------------------------------------------------
// DETERMINISTIC PAL 50Hz FRAME SYNC
// -------------------------------------------------------------

// Wait for a fixed raster line in the lower border. Polling a
// specific line (not just bit 7 of $D011) makes frame timing
// deterministic: the loop always resumes at the same beam position,
// so a logic overrun can never stretch a frame to ~2x (25Hz stutter).
static void wait_raster(unsigned char line) {
    while (PEEK(0xD012) != line);
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
        if (k == 60 || !(joy & 0x10)) break; // Space or Joy Fire
        if (kbhit()) {
            char ch = cgetc();
            if (ch == ' ' || ch == 13) break;
        }
    }

    clear_screen();
}

// -------------------------------------------------------------
// MAIN GAME LOOP (Locked PAL 50Hz / 25Hz - 100% Hardware Sprites)
// -------------------------------------------------------------

int main(void) {
    unsigned char running;
    unsigned char i;
    unsigned char joy, key;
    unsigned int tick;

    init_c64_hardware();
    sid_init();

    while (1) {
        title_screen();

        running = 1;
        lives = 3;
        score = 0;
        stage = 1;
        tick = 0;
        playerWeapon = WPN_NORMAL;
        playerShield = 0;
        playerPixelX = 160;
        playerPixelY = 224;
        invulnerableTimer = 0;
        shootCooldown = 0;

        l1_active = 0; l2_active = 0;
        d1_active = 0; d2_active = 0;
        eb_active = 0; exp_active = 0;

        init_stars();
        init_formation();
        draw_hud();

        while (running) {
            tick++;

            // 0. Deterministic PAL 50Hz frame sync: wait for raster
            // line 255 (lower border) and write all 8 sprite registers
            // while the beam is off-screen. VIC-II latches sprite X/Y
            // at the start of each raster line, so mid-screen writes
            // would tear the sprites; polling a fixed line (instead of
            // bit 7 of $D011) also stops a logic overrun from
            // stretching a frame to ~2x (25Hz stutter).
            wait_raster(255);
            sync_hardware_sprites();

            // 1. Controls (Joy 2 or WASD direct matrix)
            joy = PEEK(CIA1_PRA);
            key = PEEK(0x00C5);

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

            // Keyboard buffer check
            if (kbhit()) {
                char ch = cgetc();
                if (ch == 'a' || ch == 'A') { if (playerPixelX > 32) playerPixelX -= 4; }
                else if (ch == 'd' || ch == 'D') { if (playerPixelX < 312) playerPixelX += 4; }
                else if (ch == 'w' || ch == 'W') { if (playerPixelY > 170) playerPixelY -= 3; }
                else if (ch == 's' || ch == 'S') { if (playerPixelY < 236) playerPixelY += 3; }
                else if (ch == ' ' && shootCooldown == 0) { shoot_laser(); }
            }

            // 2. Invulnerability Timer
            if (invulnerableTimer > 0) invulnerableTimer--;

            // 3. Move Player Lasers (Hardware Sprites 2 & 3)
            if (l1_active) {
                if (l1_y > 55) l1_y -= 6;
                else l1_active = 0;
            }
            if (l2_active) {
                if (l2_y > 55) l2_y -= 6;
                else l2_active = 0;
            }

            // 4. Move Diving Boss (Hardware Sprite 4)
            if (d1_active) {
                d1_y += 2;
                d1_x += d1_dx;
                if (d1_x < 40 || d1_x > 300) d1_dx = -d1_dx;

                // Drop bomb
                if (d1_y == 120 && !eb_active) {
                    eb_active = 1;
                    eb_x = d1_x;
                    eb_y = d1_y + 10;
                }

                if (d1_y > 240) d1_active = 0;
            }

            // 5. Move Diving Bee (Hardware Sprite 5)
            if (d2_active) {
                d2_y += 3;
                d2_x += d2_dx;
                if (d2_x < 40 || d2_x > 300) d2_dx = -d2_dx;

                if (d2_y == 130 && !eb_active) {
                    eb_active = 1;
                    eb_x = d2_x;
                    eb_y = d2_y + 10;
                }

                if (d2_y > 240) d2_active = 0;
            }

            // 6. Move Enemy Bomb (Hardware Sprite 6)
            if (eb_active) {
                eb_y += 4;
                if (eb_y > 240) eb_active = 0;
            }

            // 7. Explosion Timer (Hardware Sprite 7)
            if (exp_active) {
                exp_timer--;
                if (exp_timer == 0) exp_active = 0;
            }

            // 8. Trigger Dives periodically
            if (tick > 60 && (tick % 120 == 0)) {
                trigger_dive();
            }

            // 9. Formation Swaying (incremental: only vacated and
            // newly-covered columns are rewritten, every 12 frames)
            if (tick % 12 == 0) {
                shift_formation();
                formationNeedsRedraw = 1;
            }
            if (formationNeedsRedraw) {
                draw_formation();
                formationNeedsRedraw = 0;
            }

            // 10. HARDWARE SPRITE COLLISION DETECTION ($D01E)
            {
                unsigned char sc = PEEK(VIC_SP_SP_COL);

                // Laser 1 hit Diving Boss or Diving Bee
                if (l1_active) {
                    if (sc & 0x04) {
                        if (d1_active && (sc & 0x10)) {
                            l1_active = 0; d1_active = 0;
                            trigger_explosion(d1_x, d1_y);
                            score += 150;
                            if (fast_rnd() % 4 == 0) playerWeapon = WPN_RAPID;
                            draw_hud();
                        } else if (d2_active && (sc & 0x20)) {
                            l1_active = 0; d2_active = 0;
                            trigger_explosion(d2_x, d2_y);
                            score += 80;
                            draw_hud();
                        }
                    }
                }

                // Laser 2 hit Diving Boss or Diving Bee
                if (l2_active) {
                    if (sc & 0x08) {
                        if (d1_active && (sc & 0x10)) {
                            l2_active = 0; d1_active = 0;
                            trigger_explosion(d1_x, d1_y);
                            score += 150;
                            draw_hud();
                        } else if (d2_active && (sc & 0x20)) {
                            l2_active = 0; d2_active = 0;
                            trigger_explosion(d2_x, d2_y);
                            score += 80;
                            draw_hud();
                        }
                    }
                }

                // Player Ship (Sprite 0) hit by Diving Enemy or Enemy Bomb!
                if (invulnerableTimer == 0 && (sc & 0x01)) {
                    if ((d1_active && (sc & 0x10)) || (d2_active && (sc & 0x20)) || (eb_active && (sc & 0x40))) {
                        if (playerShield > 0) {
                            playerShield--;
                            sid_shield();
                            draw_hud();
                        } else {
                            lives--;
                            trigger_explosion(playerPixelX, playerPixelY);
                            playerPixelX = 160;
                            playerPixelY = 224;
                            invulnerableTimer = 60; // 1.2s invulnerability
                            playerWeapon = WPN_NORMAL;
                            draw_hud();
                            if (lives == 0) {
                                running = 0;
                            }
                        }
                    }
                }
            }

            // 11. Laser vs Formation (Check against character grid)
            // Only the formation row the laser is on is scanned
            // (4-8 enemies instead of all 24; skipped entirely when
            // the laser is between formation rows).
            if (l1_active && l1_y < 138 && l1_y > 70) {
                unsigned char cCol = (l1_x - 24) / 8;
                unsigned char cRow = (l1_y - 50) / 8;
                unsigned char rg;
                for (rg = 0; rg < 4; ++rg) {
                    if (row_orig[rg] == cRow) {
                        unsigned char start = row_start[rg];
                        unsigned char cnt = row_count[rg];
                        for (i = start; i < start + cnt; ++i) {
                            if (enemies[i].active) {
                                unsigned char ex = enemies[i].origCol + formationSway;
                                if (cCol == ex || cCol == ex + 1) {
                                    enemies[i].hp--;
                                    l1_active = 0;
                                    if (enemies[i].hp == 0) {
                                        enemies[i].active = 0;
                                        enemiesRemaining--;
                                        FAST_CLEAR(ex, cRow);
                                        FAST_CLEAR(ex + 1, cRow);
                                        trigger_explosion(24 + ex * 8, 50 + cRow * 8);
                                        score += (enemies[i].type == 2) ? 150 : ((enemies[i].type == 1) ? 80 : 50);
                                        if (fast_rnd() % 5 == 0) playerShield = 2;
                                        draw_hud();
                                    } else {
                                        sid_laser();
                                    }
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }

            // 12. Check Wave Cleared (running counter, no per-frame scan)
            if (enemiesRemaining == 0 && !d1_active && !d2_active) {
                stage++;
                sid_powerup();
                init_formation();
                draw_hud();
            }
        }

        // GAME OVER
        POKE(VIC_SP_ENA, 0x00); // Turn off all sprites
        printText(15, 12, "GAME OVER", COLOR_RED);
        printText(9, 14, "PRESS FIRE TO RESTART", COLOR_WHITE);

        for (i = 0; i < 40; ++i) {
            wait_raster(255);
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
