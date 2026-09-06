/**
 * GALAXY - Commodore 64 Retro Arcade Edition
 * Cross-compiled for MOS 6510 / VIC-II / SID 6581 via cc65
 * (C) 2026 Retro Gaming Project
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <conio.h>
#include <c64.h>
#include <peekpoke.h>

#define SCREEN_RAM  ((unsigned char*)0x0400)
#define COLOR_RAM   ((unsigned char*)0xD800)

// SID 6581 Registers
#define SID_BASE    0xD400
#define SID_V1_FREQ_LO 0xD400
#define SID_V1_FREQ_HI 0xD401
#define SID_V1_PULSE_LO 0xD402
#define SID_V1_PULSE_HI 0xD403
#define SID_V1_CTRL    0xD404
#define SID_V1_AD      0xD405
#define SID_V1_SR      0xD406

#define SID_V3_FREQ_LO 0xD40E
#define SID_V3_FREQ_HI 0xD40F
#define SID_V3_CTRL    0xD412
#define SID_V3_AD      0xD413
#define SID_V3_SR      0xD414

#define SID_VOLUME     0xD418

// Joystick Port 2
#define CIA1_PRA    0xDC00

// Weapon types
#define WPN_NORMAL   0
#define WPN_RAPID    1
#define WPN_MISSILE  2
#define WPN_HYPER    3

// Max limits
#define MAX_STARS    18
#define MAX_ENEMIES  24
#define MAX_PBULLETS 6
#define MAX_EBULLETS 4
#define MAX_MISSILES 4

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
    int vx;
    int vy;
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

// Globals
static Star stars[MAX_STARS];
static Enemy enemies[MAX_ENEMIES];
static Bullet pBullets[MAX_PBULLETS];
static Bullet eBullets[MAX_EBULLETS];
static Missile missiles[MAX_MISSILES];
static Drop drop;

static unsigned char px = 18;
static unsigned char py = 22;
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

// SID sound helpers
void sid_init(void) {
    unsigned char i;
    for (i = 0; i < 25; ++i) {
        POKE(SID_BASE + i, 0);
    }
    POKE(SID_VOLUME, 15); // Max volume
}

void sid_laser(void) {
    POKE(SID_V1_FREQ_HI, 0x48);
    POKE(SID_V1_FREQ_LO, 0x00);
    POKE(SID_V1_AD, 0x09); // Attack 0, Decay 9
    POKE(SID_V1_SR, 0x00);
    POKE(SID_V1_CTRL, 0x21); // Sawtooth + Gate
}

void sid_explode(void) {
    POKE(SID_V3_FREQ_HI, 0x18);
    POKE(SID_V3_FREQ_LO, 0x00);
    POKE(SID_V3_AD, 0x0C); // Attack 0, Decay C
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

// Fast character put directly into VIC-II memory
void putChar(unsigned char x, unsigned char y, unsigned char ch, unsigned char col) {
    unsigned int offset = ((unsigned int)y * 40) + x;
    if (offset < 1000) {
        SCREEN_RAM[offset] = ch;
        COLOR_RAM[offset] = col;
    }
}

void printText(unsigned char x, unsigned char y, const char* str, unsigned char col) {
    unsigned int offset = ((unsigned int)y * 40) + x;
    while (*str && offset < 1000) {
        unsigned char c = *str++;
        // ASCII to screen code conversion
        if (c >= 'A' && c <= 'Z') c = c - 'A' + 1;
        else if (c >= 'a' && c <= 'z') c = c - 'a' + 1;
        else if (c >= '0' && c <= '9') c = c;
        SCREEN_RAM[offset] = c;
        COLOR_RAM[offset] = col;
        offset++;
    }
}

// Starfield setup
void init_stars(void) {
    unsigned char i;
    for (i = 0; i < MAX_STARS; ++i) {
        stars[i].x = rand() % 38 + 1;
        stars[i].y = rand() % 24;
        stars[i].speed = (rand() % 3) + 1;
        stars[i].ch = (stars[i].speed == 3) ? 42 : ((stars[i].speed == 2) ? 43 : 46); // '*', '+', '.'
        stars[i].color = (stars[i].speed == 3) ? COLOR_WHITE : ((stars[i].speed == 2) ? COLOR_CYAN : COLOR_GRAY2);
    }
}

void update_stars(void) {
    unsigned char i;
    for (i = 0; i < MAX_STARS; ++i) {
        putChar(stars[i].x, stars[i].y, 32, COLOR_BLACK); // clear
        stars[i].y += stars[i].speed;
        if (stars[i].y >= 24) {
            stars[i].y = 1;
            stars[i].x = rand() % 38 + 1;
        }
        putChar(stars[i].x, stars[i].y, stars[i].ch, stars[i].color);
    }
}

// Init enemies formation
void init_formation(void) {
    unsigned char i = 0;
    unsigned char c;

    // Row 0: 4 Bosses
    for (c = 2; c <= 5; ++c) {
        enemies[i].active = 1;
        enemies[i].type = 2;
        enemies[i].hp = 2;
        enemies[i].targetX = 6 + c * 5;
        enemies[i].targetY = 4;
        enemies[i].curX = enemies[i].targetX;
        enemies[i].curY = enemies[i].targetY;
        enemies[i].state = 0;
        enemies[i].timer = 0;
        i++;
    }

    // Row 1: 8 Butterflies
    for (c = 0; c < 8; ++c) {
        enemies[i].active = 1;
        enemies[i].type = 1;
        enemies[i].hp = 1;
        enemies[i].targetX = 2 + c * 4;
        enemies[i].targetY = 6;
        enemies[i].curX = enemies[i].targetX;
        enemies[i].curY = enemies[i].targetY;
        enemies[i].state = 0;
        enemies[i].timer = 0;
        i++;
    }

    // Row 2: 8 Bees
    for (c = 0; c < 8; ++c) {
        enemies[i].active = 1;
        enemies[i].type = 0;
        enemies[i].hp = 1;
        enemies[i].targetX = 2 + c * 4;
        enemies[i].targetY = 8;
        enemies[i].curX = enemies[i].targetX;
        enemies[i].curY = enemies[i].targetY;
        enemies[i].state = 0;
        enemies[i].timer = 0;
        i++;
    }

    drop.active = 0;
}

// Draw Player Ship: "<^>"
void draw_player(void) {
    unsigned char col = COLOR_WHITE;
    if (playerShield > 0) {
        col = (tick & 2) ? COLOR_CYAN : COLOR_WHITE;
        putChar(px - 1, py, '(', COLOR_LIGHTBLUE);
        putChar(px + 3, py, ')', COLOR_LIGHTBLUE);
    } else {
        putChar(px - 1, py, ' ', COLOR_BLACK);
        putChar(px + 3, py, ' ', COLOR_BLACK);
    }
    putChar(px, py, '<', COLOR_RED);
    putChar(px + 1, py, 94, col); // '^'
    putChar(px + 2, py, '>', COLOR_RED);
}

void clear_player(void) {
    putChar(px - 1, py, ' ', COLOR_BLACK);
    putChar(px, py, ' ', COLOR_BLACK);
    putChar(px + 1, py, ' ', COLOR_BLACK);
    putChar(px + 2, py, ' ', COLOR_BLACK);
    putChar(px + 3, py, ' ', COLOR_BLACK);
}

// Shooting
void shoot_laser(void) {
    unsigned char i;
    sid_laser();

    if (playerWeapon == WPN_RAPID) {
        shootCooldown = 2;
        for (i = 0; i < MAX_PBULLETS - 1; i += 2) {
            if (!pBullets[i].active && !pBullets[i + 1].active) {
                pBullets[i].active = 1;
                pBullets[i].x = px;
                pBullets[i].y = py - 1;
                pBullets[i + 1].active = 1;
                pBullets[i + 1].x = px + 2;
                pBullets[i + 1].y = py - 1;
                break;
            }
        }
    } else if (playerWeapon == WPN_MISSILE) {
        shootCooldown = 5;
        // Normal laser
        for (i = 0; i < MAX_PBULLETS; ++i) {
            if (!pBullets[i].active) {
                pBullets[i].active = 1;
                pBullets[i].x = px + 1;
                pBullets[i].y = py - 1;
                break;
            }
        }
        // Homing missile
        for (i = 0; i < MAX_MISSILES; ++i) {
            if (!missiles[i].active) {
                missiles[i].active = 1;
                missiles[i].x = px + 1;
                missiles[i].y = py - 1;
                missiles[i].type = 0;
                break;
            }
        }
    } else if (playerWeapon == WPN_HYPER) {
        shootCooldown = 4;
        for (i = 0; i < MAX_MISSILES - 1; i += 2) {
            if (!missiles[i].active && !missiles[i + 1].active) {
                missiles[i].active = 1;
                missiles[i].x = px;
                missiles[i].y = py - 1;
                missiles[i].type = 1;
                missiles[i + 1].active = 1;
                missiles[i + 1].x = px + 2;
                missiles[i + 1].y = py - 1;
                missiles[i + 1].type = 1;
                break;
            }
        }
    } else { // NORMAL
        shootCooldown = 4;
        for (i = 0; i < MAX_PBULLETS; ++i) {
            if (!pBullets[i].active) {
                pBullets[i].active = 1;
                pBullets[i].x = px + 1;
                pBullets[i].y = py - 1;
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

// Update HUD
void draw_hud(void) {
    char buf[16];
    sprintf(buf, "1UP:%05d", score);
    printText(1, 0, buf, COLOR_WHITE);

    sprintf(buf, "HIGH:%05d", highScore);
    printText(15, 0, buf, COLOR_YELLOW);

    sprintf(buf, "L:%d", lives);
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

// Trigger diving alien
void trigger_dive(void) {
    unsigned char i;
    for (i = 0; i < MAX_ENEMIES; ++i) {
        if (enemies[i].active && enemies[i].state == 0) {
            if ((rand() % 8) == 0) {
                enemies[i].state = 1; // Diving
                enemies[i].timer = 0;
                break;
            }
        }
    }
}

// Title screen
void title_screen(void) {
    clrscr();
    bordercolor(COLOR_BLUE);
    bgcolor(COLOR_BLACK);

    printText(7, 3, "**** COMMODORE 64 GALAXY ****", COLOR_YELLOW);
    printText(12, 5, "1985 RETRO ARCADE", COLOR_CYAN);

    printText(10, 8, "- POINT TABLE -", COLOR_WHITE);
    printText(12, 10, "<o> BEE        50 PTS", COLOR_YELLOW);
    printText(12, 12, "[V] BUTTERFLY  80 PTS", COLOR_LIGHTRED);
    printText(12, 14, "(W) BOSS      150 PTS", COLOR_LIGHTGREEN);

    printText(8, 17, "CONTROLS: WASD / JOYSTICK 2", COLOR_CYAN);
    printText(10, 19, "FIRE: SPACE / JOY BUTTON", COLOR_CYAN);

    printText(6, 22, "PRESS SPACE OR FIRE TO START", COLOR_WHITE);

    while (1) {
        unsigned char joy = PEEK(CIA1_PRA);
        if (kbhit()) {
            char k = cgetc();
            if (k == ' ' || k == 13) break;
        }
        if (!(joy & 0x10)) { // Joy 2 fire button
            break;
        }
    }

    clrscr();
}

// MAIN
int main(void) {
    unsigned char running = 1;
    unsigned char i, ei;
    unsigned char joy;

    sid_init();
    title_screen();

    init_stars();
    init_formation();
    draw_hud();

    while (running) {
        tick++;

        // 1. Controls (Keyboard WASD + Joystick in Port 2)
        joy = PEEK(CIA1_PRA);
        clear_player();

        // WASD
        if (kbhit()) {
            char k = cgetc();
            if ((k == 'a' || k == 'A') && px > 1) px--;
            else if ((k == 'd' || k == 'D') && px < 36) px++;
            else if ((k == 'w' || k == 'W') && py > 16) py--;
            else if ((k == 's' || k == 'S') && py < 23) py++;
            else if (k == ' ' && shootCooldown == 0) {
                shoot_laser();
            }
        }

        // Joystick 2
        if (!(joy & 0x04) && px > 1) px--; // Left
        if (!(joy & 0x08) && px < 36) px++; // Right
        if (!(joy & 0x01) && py > 16) py--; // Up
        if (!(joy & 0x02) && py < 23) py++; // Down
        if (!(joy & 0x10) && shootCooldown == 0) { // Fire
            shoot_laser();
        }

        if (shootCooldown > 0) shootCooldown--;

        // 2. Stars
        if (tick % 2 == 0) {
            update_stars();
        }

        // 3. Formation sway & diving
        if (tick % 12 == 0) {
            formationSway += formationDir;
            if (formationSway >= 3 || formationSway == 0) {
                formationDir = -formationDir;
            }
        }

        if (tick % 30 == 0) {
            trigger_dive();
        }

        // 4. Update Enemies
        for (i = 0; i < MAX_ENEMIES; ++i) {
            if (!enemies[i].active) continue;

            // Clear old position
            putChar(enemies[i].curX, enemies[i].curY, ' ', COLOR_BLACK);
            putChar(enemies[i].curX + 1, enemies[i].curY, ' ', COLOR_BLACK);
            putChar(enemies[i].curX + 2, enemies[i].curY, ' ', COLOR_BLACK);

            if (enemies[i].state == 0) {
                // In formation
                enemies[i].curX = enemies[i].targetX + formationSway;
                enemies[i].curY = enemies[i].targetY;
            } else if (enemies[i].state == 1) {
                // Diving
                enemies[i].timer++;
                enemies[i].curY++;
                if (enemies[i].curX < px) enemies[i].curX++;
                else if (enemies[i].curX > px) enemies[i].curX--;

                // Dive shot
                if (enemies[i].timer == 8 && (rand() % 2 == 0)) {
                    for (ei = 0; ei < MAX_EBULLETS; ++ei) {
                        if (!eBullets[ei].active) {
                            eBullets[ei].active = 1;
                            eBullets[ei].x = enemies[i].curX + 1;
                            eBullets[ei].y = enemies[i].curY + 1;
                            break;
                        }
                    }
                }

                if (enemies[i].curY >= 24) {
                    enemies[i].curY = 2;
                    enemies[i].state = 0;
                }
            }

            // Draw enemy
            if (enemies[i].type == 2) {
                // Boss
                putChar(enemies[i].curX, enemies[i].curY, '(', COLOR_LIGHTGREEN);
                putChar(enemies[i].curX + 1, enemies[i].curY, 'W', COLOR_YELLOW);
                putChar(enemies[i].curX + 2, enemies[i].curY, ')', COLOR_LIGHTGREEN);
            } else if (enemies[i].type == 1) {
                // Butterfly
                putChar(enemies[i].curX, enemies[i].curY, '[', COLOR_RED);
                putChar(enemies[i].curX + 1, enemies[i].curY, 'V', COLOR_LIGHTRED);
                putChar(enemies[i].curX + 2, enemies[i].curY, ']', COLOR_RED);
            } else {
                // Bee
                putChar(enemies[i].curX, enemies[i].curY, '<', COLOR_YELLOW);
                putChar(enemies[i].curX + 1, enemies[i].curY, 'o', COLOR_CYAN);
                putChar(enemies[i].curX + 2, enemies[i].curY, '>', COLOR_YELLOW);
            }
        }

        // 5. Update Player Bullets
        for (i = 0; i < MAX_PBULLETS; ++i) {
            if (!pBullets[i].active) continue;
            putChar(pBullets[i].x, pBullets[i].y, ' ', COLOR_BLACK);
            if (pBullets[i].y > 2) {
                pBullets[i].y--;
                putChar(pBullets[i].x, pBullets[i].y, '|', COLOR_YELLOW);

                // Collision with enemies
                for (ei = 0; ei < MAX_ENEMIES; ++ei) {
                    if (enemies[ei].active &&
                        pBullets[i].y == enemies[ei].curY &&
                        pBullets[i].x >= enemies[ei].curX &&
                        pBullets[i].x <= enemies[ei].curX + 2) {

                        enemies[ei].hp--;
                        pBullets[i].active = 0;
                        putChar(pBullets[i].x, pBullets[i].y, ' ', COLOR_BLACK);

                        if (enemies[ei].hp == 0) {
                            enemies[ei].active = 0;
                            putChar(enemies[ei].curX, enemies[ei].curY, '*', COLOR_YELLOW);
                            putChar(enemies[ei].curX + 1, enemies[ei].curY, '#', COLOR_LIGHTRED);
                            putChar(enemies[ei].curX + 2, enemies[ei].curY, '*', COLOR_YELLOW);
                            sid_explode();
                            score += (enemies[ei].type == 2) ? 150 : ((enemies[ei].type == 1) ? 80 : 50);
                            check_drop(enemies[ei].curX + 1, enemies[ei].curY);
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

        // 6. Update Missiles
        for (i = 0; i < MAX_MISSILES; ++i) {
            if (!missiles[i].active) continue;
            putChar(missiles[i].x, missiles[i].y, ' ', COLOR_BLACK);
            if (missiles[i].y > 2) {
                missiles[i].y--;
                // Homing tracking
                if (missiles[i].type == 0) {
                    for (ei = 0; ei < MAX_ENEMIES; ++ei) {
                        if (enemies[ei].active) {
                            if (missiles[i].x < enemies[ei].curX + 1) missiles[i].x++;
                            else if (missiles[i].x > enemies[ei].curX + 1) missiles[i].x--;
                            break;
                        }
                    }
                }
                putChar(missiles[i].x, missiles[i].y, 94, COLOR_LIGHTRED); // '^'

                // Collision
                for (ei = 0; ei < MAX_ENEMIES; ++ei) {
                    if (enemies[ei].active &&
                        missiles[i].y == enemies[ei].curY &&
                        missiles[i].x >= enemies[ei].curX &&
                        missiles[i].x <= enemies[ei].curX + 2) {

                        enemies[ei].active = 0;
                        missiles[i].active = 0;
                        putChar(missiles[i].x, missiles[i].y, ' ', COLOR_BLACK);
                        sid_explode();
                        score += 120;
                        check_drop(enemies[ei].curX + 1, enemies[ei].curY);
                        draw_hud();
                        break;
                    }
                }
            } else {
                missiles[i].active = 0;
            }
        }

        // 7. Update Enemy Bullets
        for (i = 0; i < MAX_EBULLETS; ++i) {
            if (!eBullets[i].active) continue;
            putChar(eBullets[i].x, eBullets[i].y, ' ', COLOR_BLACK);
            if (eBullets[i].y < 24) {
                eBullets[i].y++;
                putChar(eBullets[i].x, eBullets[i].y, 81, COLOR_LIGHTRED); // Ball

                // Hit player
                if (eBullets[i].y == py && eBullets[i].x >= px && eBullets[i].x <= px + 2) {
                    eBullets[i].active = 0;
                    putChar(eBullets[i].x, eBullets[i].y, ' ', COLOR_BLACK);

                    if (playerShield > 0) {
                        playerShield--;
                        sid_shield();
                        draw_hud();
                    } else {
                        sid_explode();
                        lives--;
                        playerWeapon = WPN_NORMAL;
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

        // 7.5 Check enemy ship crashing into player ship (Diving Ramming Attack!)
        for (i = 0; i < MAX_ENEMIES; ++i) {
            if (enemies[i].active && enemies[i].state == 1) { // Diving
                if (enemies[i].curY >= py - 1 && enemies[i].curY <= py + 1 &&
                    enemies[i].curX + 2 >= px && enemies[i].curX <= px + 2) {

                    if (playerShield > 0) {
                        playerShield--;
                        sid_shield();
                        enemies[i].active = 0;
                        putChar(enemies[i].curX, enemies[i].curY, '*', COLOR_YELLOW);
                        putChar(enemies[i].curX + 1, enemies[i].curY, '#', COLOR_LIGHTRED);
                        putChar(enemies[i].curX + 2, enemies[i].curY, '*', COLOR_YELLOW);
                        draw_hud();
                    } else {
                        sid_explode();
                        enemies[i].active = 0;
                        lives--;
                        playerWeapon = WPN_NORMAL;
                        draw_hud();
                        if (lives == 0) {
                            running = 0;
                        }
                    }
                    break;
                }
            }
        }

        // 8. Update Drop Capsule
        if (drop.active) {
            putChar(drop.x, drop.y, ' ', COLOR_BLACK);
            if (tick % 3 == 0) drop.y++;
            if (drop.y < 24) {
                putChar(drop.x, drop.y, drop.type, drop.color);

                // Pickup by player
                if (drop.y == py && drop.x >= px - 1 && drop.x <= px + 3) {
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
                    putChar(drop.x, drop.y, ' ', COLOR_BLACK);
                    draw_hud();
                }
            } else {
                drop.active = 0;
            }
        }

        // 9. Draw Player
        draw_player();

        // 10. Check wave cleared
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

        // Lock to VIC-II vertical blanking interval (authentic 50Hz PAL timing)
        waitvsync();
    }

    // GAME OVER
    printText(15, 12, "GAME OVER", COLOR_RED);
    printText(9, 14, "PRESS FIRE TO RESTART", COLOR_WHITE);
    while (1) {
        joy = PEEK(CIA1_PRA);
        if (kbhit() || !(joy & 0x10)) break;
    }

    return 0;
}
