/**
 * GALAXY - 8-Bit NES Parallax Starfield
 * Faithful to classic Galaga/Galaxian twinkling stars
 */

export class Starfield {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.stars = [];
    this.colors = ['#FCFCFC', '#F83800', '#3CBCFC', '#FCB800', '#F87800', '#58F858'];
    this.speedMultiplier = 1.0;
    this.initStars(50);
  }

  initStars(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const speedTier = Math.random();
      let speed, size;
      if (speedTier < 0.6) {
        speed = 0.5 + Math.random() * 0.5; // Slow background star
        size = 1;
      } else if (speedTier < 0.88) {
        speed = 1.2 + Math.random() * 0.8; // Medium star
        size = 1.5;
      } else {
        speed = 2.4 + Math.random() * 1.0; // Fast foreground star
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

      // Twinkle cycle
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
