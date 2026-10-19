type SoundBuilder = (ctx: AudioContext, out: GainNode) => () => void;

interface ActiveGraph {
  id: string;
  stop: () => void;
}

let sharedCtx: AudioContext | null = null;
let active: ActiveGraph | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  if (sharedCtx.state === 'suspended') void sharedCtx.resume();
  return sharedCtx;
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function brownBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 3;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function loopNoise(ctx: AudioContext): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  return src;
}

function loopBrown(ctx: AudioContext): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = brownBuffer(ctx);
  src.loop = true;
  return src;
}

function connectDrone(ctx: AudioContext, out: GainNode, freqs: number[], gain: number, detune = 0): () => void {
  const oscs = freqs.map((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g);
    g.connect(out);
    osc.start();
    return { osc, g };
  });
  return () => {
    for (const { osc, g } of oscs) {
      osc.stop();
      g.disconnect();
    }
  };
}

function connectLfo(ctx: AudioContext, target: AudioParam, rate: number, depth: number): () => void {
  const lfo = ctx.createOscillator();
  lfo.frequency.value = rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  lfo.start();
  return () => {
    lfo.stop();
    lfoGain.disconnect();
  };
}

const builders: Record<string, SoundBuilder> = {
  rain(ctx, out) {
    const stops: Array<() => void> = [];
    const src = loopNoise(ctx);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1600;
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 350;
    const g = ctx.createGain();
    g.gain.value = 0.07;
    src.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(g);
    g.connect(out);
    src.start();
    stops.push(() => {
      src.stop();
      lowpass.disconnect();
      highpass.disconnect();
      g.disconnect();
    });
    return () => stops.forEach((s) => s());
  },

  ocean(ctx, out) {
    const stops: Array<() => void> = [];
    const src = loopNoise(ctx);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 320;
    const g = ctx.createGain();
    g.gain.value = 0.06;
    src.connect(lowpass);
    lowpass.connect(g);
    g.connect(out);
    src.start();
    stops.push(() => {
      src.stop();
      lowpass.disconnect();
      g.disconnect();
    });
    return () => stops.forEach((s) => s());
  },

  forest(ctx, out) {
    const stops: Array<() => void> = [];
    const src = loopNoise(ctx);
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.value = 0.03;
    src.connect(highpass);
    highpass.connect(g);
    g.connect(out);
    src.start();
    stops.push(() => {
      src.stop();
      highpass.disconnect();
      g.disconnect();
    });

    const chirp = () => {
      if (Math.random() < 0.45) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + Math.random() * 1400, t);
      osc.frequency.exponentialRampToValueAtTime(3200 + Math.random() * 800, t + 0.12);
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(0.018, t + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(amp);
      amp.connect(out);
      osc.start(t);
      osc.stop(t + 0.2);
      stops.push(() => {
        osc.stop();
        amp.disconnect();
      });
    };

    const timer = window.setInterval(chirp, 1800);
    chirp();
    return () => {
      window.clearInterval(timer);
      stops.forEach((s) => s());
    };
  },

  lofi(ctx, out) {
    const stops: Array<() => void> = [];
    stops.push(connectDrone(ctx, out, [130.81, 164.81, 196.0, 246.94], 0.018));
    stops.push(connectLfo(ctx, out.gain, 0.35, 0.05));
    return () => stops.forEach((s) => s());
  },

  cafe(ctx, out) {
    const stops: Array<() => void> = [];
    const src = loopNoise(ctx);
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1100;
    bandpass.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.04;
    src.connect(bandpass);
    bandpass.connect(g);
    g.connect(out);
    src.start();
    stops.push(() => {
      src.stop();
      bandpass.disconnect();
      g.disconnect();
    });
    const timer = window.setInterval(() => {
      g.gain.setTargetAtTime(0.02 + Math.random() * 0.05, ctx.currentTime, 0.15);
    }, 350);
    return () => {
      window.clearInterval(timer);
      stops.forEach((s) => s());
    };
  },

  white(ctx, out) {
    const src = loopNoise(ctx);
    const g = ctx.createGain();
    g.gain.value = 0.035;
    src.connect(g);
    g.connect(out);
    src.start();
    return () => {
      src.stop();
      g.disconnect();
    };
  },

  brown(ctx, out) {
    const src = loopBrown(ctx);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.value = 0.12;
    src.connect(lowpass);
    lowpass.connect(g);
    g.connect(out);
    src.start();
    return () => {
      src.stop();
      lowpass.disconnect();
      g.disconnect();
    };
  },

  wind(ctx, out) {
    const stops: Array<() => void> = [];
    const src = loopNoise(ctx);
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 500;
    bandpass.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0.06;
    src.connect(bandpass);
    bandpass.connect(g);
    g.connect(out);
    src.start();
    stops.push(() => {
      src.stop();
      bandpass.disconnect();
      g.disconnect();
    });
    stops.push(connectLfo(ctx, bandpass.frequency, 0.08, 260));
    stops.push(connectLfo(ctx, g.gain, 0.05, 0.03));
    return () => stops.forEach((s) => s());
  },

  thunder(ctx, out) {
    const stops: Array<() => void> = [];
    const src = loopNoise(ctx);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1400;
    const bed = ctx.createGain();
    bed.gain.value = 0.06;
    src.connect(lowpass);
    lowpass.connect(bed);
    bed.connect(out);
    src.start();
    stops.push(() => {
      src.stop();
      lowpass.disconnect();
      bed.disconnect();
    });

    const voiceBus = ctx.createGain();
    voiceBus.connect(out);
    stops.push(() => voiceBus.disconnect());

    const boom = () => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(70 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 1.6);
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(0.22, t + 0.15);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      osc.connect(amp);
      amp.connect(voiceBus);
      osc.start(t);
      osc.stop(t + 1.9);
    };
    const timer = window.setInterval(() => {
      if (Math.random() < 0.35) boom();
    }, 3200);
    boom();
    return () => {
      window.clearInterval(timer);
      stops.forEach((s) => s());
    };
  },

  fireplace(ctx, out) {
    const stops: Array<() => void> = [];
    const src = loopBrown(ctx);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 900;
    const bed = ctx.createGain();
    bed.gain.value = 0.1;
    src.connect(lowpass);
    lowpass.connect(bed);
    bed.connect(out);
    src.start();
    stops.push(() => {
      src.stop();
      lowpass.disconnect();
      bed.disconnect();
    });

    const voiceBus = ctx.createGain();
    voiceBus.connect(out);
    stops.push(() => voiceBus.disconnect());

    const crackle = () => {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const t = ctx.currentTime + Math.random() * 0.08;
        const n = ctx.createBufferSource();
        n.buffer = noiseBuffer(ctx);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1800;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.05, t + 0.005);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        n.connect(hp);
        hp.connect(amp);
        amp.connect(voiceBus);
        n.start(t);
        n.stop(t + 0.06);
      }
    };
    const timer = window.setInterval(crackle, 300);
    crackle();
    return () => {
      window.clearInterval(timer);
      stops.forEach((s) => s());
    };
  },

  night(ctx, out) {
    const stops: Array<() => void> = [];
    const src = loopNoise(ctx);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 400;
    const bed = ctx.createGain();
    bed.gain.value = 0.05;
    src.connect(lowpass);
    lowpass.connect(bed);
    bed.connect(out);
    src.start();
    stops.push(() => {
      src.stop();
      lowpass.disconnect();
      bed.disconnect();
    });

    const voiceBus = ctx.createGain();
    voiceBus.connect(out);
    stops.push(() => voiceBus.disconnect());

    const chirp = () => {
      const pulses = 2 + Math.floor(Math.random() * 2);
      const base = 3800 + Math.random() * 900;
      for (let i = 0; i < pulses; i++) {
        const t = ctx.currentTime + i * 0.09;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = base;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.012, t + 0.01);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        osc.connect(amp);
        amp.connect(voiceBus);
        osc.start(t);
        osc.stop(t + 0.08);
      }
    };
    const timer = window.setInterval(() => {
      if (Math.random() < 0.7) chirp();
    }, 1400);
    chirp();
    return () => {
      window.clearInterval(timer);
      stops.forEach((s) => s());
    };
  },

  piano(ctx, out) {
    const stops: Array<() => void> = [];
    const master = ctx.createGain();
    master.gain.value = 0.05;
    master.connect(out);
    stops.push(() => master.disconnect());

    const chords = [
      [261.63, 329.63, 392.0],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
    ];
    let idx = 0;

    const note = (freq: number, t: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      osc.connect(amp);
      amp.connect(master);
      osc.start(t);
      osc.stop(t + 2.5);
    };

    const playChord = () => {
      const t = ctx.currentTime;
      const chord = chords[idx % chords.length];
      idx++;
      chord.forEach((f, i) => note(f, t + i * 0.12));
    };

    playChord();
    const timer = window.setInterval(playChord, 3400);
    return () => {
      window.clearInterval(timer);
      stops.forEach((s) => s());
    };
  },

  silence() {
    return () => undefined;
  },
};

export function startSound(id: string): void {
  stopSound();
  const ctx = getContext();
  if (!ctx) return;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);
  const build = builders[id] ?? builders.silence;
  const stop = build(ctx, out);
  active = {
    id,
    stop: () => {
      stop();
      out.disconnect();
    },
  };
}

export function stopSound(): void {
  if (active) {
    active.stop();
    active = null;
  }
}

export function isSoundActive(id: string): boolean {
  return active?.id === id;
}