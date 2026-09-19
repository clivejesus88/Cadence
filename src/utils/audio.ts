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

function loopNoise(ctx: AudioContext): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
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