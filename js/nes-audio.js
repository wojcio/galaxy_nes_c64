/**
 * GALAXY - 8-Bit NES APU Audio Synthesizer
 * Emulates Nintendo 2A03 Sound Channels (Pulse 1, Pulse 2, Triangle, LFSR Noise)
 */

export class NesAudio {
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
      this.masterGain.gain.value = 0.25; // Good comfortable default volume
      this.masterGain.connect(this.ctx.destination);

      // Generate authentic 15-bit NES pseudo-random noise buffer
      this.createNesNoiseBuffer();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  createNesNoiseBuffer() {
    // 1-second buffer of authentic NES LFSR pseudo-random noise
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let shiftRegister = 1;
    let period = Math.floor(sampleRate / 1789773 * 1000) || 12; // NES noise divider
    let counter = 0;
    let sample = 0;

    for (let i = 0; i < bufferSize; i++) {
      counter++;
      if (counter >= period) {
        counter = 0;
        // 15-bit LFSR feedback: bit 0 XOR bit 1
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
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Helper to create custom duty-cycle pulse wave (classic NES 12.5%, 25%, 50%)
   */
  createPulseWave(duty = 0.5) {
    if (!this.ctx) return null;
    const n = 64;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let i = 1; i < n; i++) {
      // Fourier coefficients for square wave with duty cycle
      imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    }
    return this.ctx.createPeriodicWave(real, imag);
  }

  /**
   * SFX: Player Laser Fire (Sharp descending pulse zap)
   */
  playShoot() {
    if (!this.initialized || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // 25% duty cycle pulse
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

  /**
   * SFX: Alien Dive / Swoop (Oscillating retro warble)
   */
  playDive() {
    if (!this.initialized || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    // Frequency warble
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

  /**
   * SFX: Enemy Laser / Missile
   */
  playEnemyShoot() {
    if (!this.initialized || this.isMuted) return;
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

  /**
   * SFX: Enemy Exploded (Crunchy NES LFSR noise decay)
   */
  playExplosion(isBoss = false) {
    if (!this.initialized || this.isMuted) return;
    const t = this.ctx.currentTime;
    const duration = isBoss ? 0.45 : 0.25;

    // Noise channel
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

    // Secondary pulse thud
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

  /**
   * SFX: Player Destroyed (Dramatic cascading explosion)
   */
  playPlayerDeath() {
    if (!this.initialized || this.isMuted) return;
    const t = this.ctx.currentTime;
    const duration = 1.2;

    // Deep crunchy noise
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

    // Descending broken tones
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

  /**
   * Fanfare: Stage Start Chiptune Theme (Authentic NES 2-Pulse + Triangle)
   */
  playStartJingle() {
    if (!this.initialized || this.isMuted) return;
    const t = this.ctx.currentTime + 0.05;

    // Note pitches (Hz)
    const N = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
      C6: 1046.50
    };

    // Melody sequence: [note, duration, timeOffset]
    const melody = [
      [N.G4, 0.09, 0.00],
      [N.C5, 0.09, 0.10],
      [N.E5, 0.09, 0.20],
      [N.G5, 0.18, 0.30],
      [N.E5, 0.09, 0.50],
      [N.G5, 0.28, 0.60],

      [N.A4, 0.09, 0.95],
      [N.D5, 0.09, 1.05],
      [N.F5, 0.09, 1.15],
      [N.A5, 0.18, 1.25],
      [N.F5, 0.09, 1.45],
      [N.A5, 0.28, 1.55],

      [N.B4, 0.09, 1.90],
      [N.D5, 0.09, 2.00],
      [N.G5, 0.09, 2.10],
      [N.B5, 0.18, 2.20],
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

    // Triangle bass backing
    const bass = [
      [N.C4 / 2, 0.45, 0.00],
      [N.C4 / 2, 0.45, 0.50],
      [N.D4 / 2, 0.45, 0.95],
      [N.D4 / 2, 0.45, 1.45],
      [N.G4 / 2, 0.45, 1.90],
      [N.C4 / 2, 0.55, 2.40]
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

  /**
   * Fanfare: Stage Clear Victory Sound
   */
  playStageClear() {
    if (!this.initialized || this.isMuted) return;
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

  /**
   * SFX: Hit / Shield Ricochet
   */
  playHit() {
    if (!this.initialized || this.isMuted) return;
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
