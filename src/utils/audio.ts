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

// A short percussive envelope with exponential decay — used for plucks, ticks
// and noise-based drum hits.
function strike(ctx: AudioContext, out: GainNode, opts: {
  freq: number;
  type?: OscillatorType;
  peak?: number;
  attack?: number;
  decay: number;
  at?: number;
  detune?: number;
  filter?: { type: BiquadFilterType; freq: number; q?: number };
}): void {
  const t = opts.at ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.value = opts.freq;
  if (opts.detune) osc.detune.value = opts.detune;
  const amp = ctx.createGain();
  const peak = opts.peak ?? 0.4;
  const attack = opts.attack ?? 0.008;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(peak, t + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
  let node: AudioNode = osc;
  if (opts.filter) {
    const f = ctx.createBiquadFilter();
    f.type = opts.filter.type;
    f.frequency.value = opts.filter.freq;
    if (opts.filter.q !== undefined) f.Q.value = opts.filter.q;
    osc.connect(f);
    node = f;
  }
  node.connect(amp);
  amp.connect(out);
  osc.start(t);
  osc.stop(t + opts.decay + 0.05);
}

function noiseHit(ctx: AudioContext, out: GainNode, opts: {
  peak?: number;
  decay: number;
  at?: number;
  type: BiquadFilterType;
  freq: number;
  q?: number;
}): void {
  const t = opts.at ?? ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = opts.type;
  f.frequency.value = opts.freq;
  if (opts.q !== undefined) f.Q.value = opts.q;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(opts.peak ?? 0.08, t + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
  src.connect(f);
  f.connect(amp);
  amp.connect(out);
  src.start(t);
  src.stop(t + opts.decay + 0.05);
}

// Turns a note table into an interval-driven scheduler with a lookahead, so
// sequences stay on-grid even when the tab is throttled.
function scheduleLoop(
  ctx: AudioContext,
  stepMs: number,
  stepsPerBar: number,
  onStep: (step: number, time: number) => void
): () => void {
  const lookahead = 0.1;
  let next = ctx.currentTime + 0.06;
  let step = 0;
  const timer = window.setInterval(() => {
    while (next < ctx.currentTime + lookahead) {
      onStep(step % stepsPerBar, next);
      step += 1;
      next += stepMs / 1000;
    }
  }, 25);
  return () => window.clearInterval(timer);
}

function hz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface ScoreEvent {
  step: number;
  note: number;
  len?: number;
  peak?: number;
  type?: OscillatorType;
  attack?: number;
  detune?: number;
}

// Renders a looping note score. Notes are given as MIDI numbers and placed on
// fixed steps, which keeps the timing sample-accurate through scheduleLoop.
function buildScore(
  ctx: AudioContext,
  out: GainNode,
  opts: {
    stepMs: number;
    steps: number;
    bus?: number;
    filter?: { type: BiquadFilterType; freq: number; q?: number };
    events: ScoreEvent[];
  }
): () => void {
  const stops: Array<() => void> = [];
  const bus = ctx.createGain();
  bus.gain.value = opts.bus ?? 0.06;
  if (opts.filter) {
    const f = ctx.createBiquadFilter();
    f.type = opts.filter.type;
    f.frequency.value = opts.filter.freq;
    if (opts.filter.q !== undefined) f.Q.value = opts.filter.q;
    bus.connect(f);
    f.connect(out);
    stops.push(() => {
      bus.disconnect();
      f.disconnect();
    });
  } else {
    bus.connect(out);
    stops.push(() => bus.disconnect());
  }

  const byStep = new Map<number, ScoreEvent[]>();
  for (const e of opts.events) {
    const list = byStep.get(e.step);
    if (list) list.push(e);
    else byStep.set(e.step, [e]);
  }

  const stopLoop = scheduleLoop(ctx, opts.stepMs, opts.steps, (step, time) => {
    const list = byStep.get(step);
    if (!list) return;
    for (const e of list) {
      strike(ctx, bus, {
        freq: hz(e.note),
        type: e.type ?? 'sine',
        peak: e.peak ?? 0.28,
        attack: e.attack ?? 0.012,
        decay: e.len ?? 1.6,
        at: time,
        detune: e.detune
      });
    }
  });
  stops.push(stopLoop);
  return () => stops.forEach((s) => s());
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
    // Lo-fi groove: soft sine pads over a lazy kick/hat grid with a touch of
    // swing. 80 BPM, one bar of 16 steps (~2s per bar).
    const stops: Array<() => void> = [];
    const padBus = ctx.createGain();
    padBus.gain.value = 0.05;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1800;
    padBus.connect(lowpass);
    lowpass.connect(out);
    stops.push(() => {
      padBus.disconnect();
      lowpass.disconnect();
    });

    const chords = [
      [174.61, 220.0, 261.63, 329.63],
      [155.56, 196.0, 233.08, 293.66],
      [130.81, 164.81, 196.0, 246.94],
      [146.83, 185.0, 220.0, 277.18]
    ];
    let bar = 0;

    const stepMs = 187.5; // 80 BPM sixteenths
    const stopLoop = scheduleLoop(ctx, stepMs, 16, (step, time) => {
      // Kick on 1 and 3, snare-ish hat on 2 and 4, ghost hats between.
      if (step === 0 || step === 8) {
        strike(ctx, out, { freq: 62, type: 'sine', peak: 0.16, decay: 0.3, at: time });
      }
      if (step === 4 || step === 12) {
        noiseHit(ctx, out, { type: 'highpass', freq: 1400, peak: 0.05, decay: 0.14, at: time });
      }
      if (step % 2 === 1) {
        noiseHit(ctx, out, { type: 'highpass', freq: 6000, peak: 0.015, decay: 0.05, at: time });
      }
      if (step === 0) {
        const chord = chords[bar % chords.length];
        bar += 1;
        chord.forEach((f, i) => strike(ctx, padBus, { freq: f, type: 'triangle', peak: 0.14, decay: 2.2, at: time + i * 0.02 }));
      }
    });
    stops.push(stopLoop);
    return () => stops.forEach((s) => s());
  },

  classical(ctx, out) {
    // Instrumental chamber harmony in the spirit of Bach/Satie: gentle
    // sine plucks roaming through diatonic seventh chords, slow tempo.
    const stops: Array<() => void> = [];
    const bus = ctx.createGain();
    bus.gain.value = 0.06;
    bus.connect(out);
    stops.push(() => bus.disconnect());

    const chords = [
      [261.63, 329.63, 392.0, 493.88],
      [220.0, 277.18, 329.63, 440.0],
      [196.0, 246.94, 293.66, 392.0],
      [174.61, 220.0, 261.63, 349.23]
    ];
    let bar = 0;
    const stepMs = 300; // 50 BPM eighths
    const stopLoop = scheduleLoop(ctx, stepMs, 16, (step, time) => {
      if (step % 4 === 0) {
        const chord = chords[bar % chords.length];
        const f = chord[(step / 4) % chord.length];
        strike(ctx, bus, { freq: f, type: 'sine', peak: 0.3, attack: 0.02, decay: 1.8, at: time });
      }
      if (step === 15) bar += 1;
    });
    stops.push(stopLoop);
    return () => stops.forEach((s) => s());
  },

  gymnopedie(ctx, out) {
    // Satie — Gymnopédie No. 1 (public domain). A slow 3/4 waltz of soft
    // seventh chords with a weightless melody floating above.
    const bar = 6; // eighth notes per 3/4 bar
    const chords = [
      { bass: 43, notes: [59, 62, 66] }, // G · Gmaj7
      { bass: 38, notes: [54, 57, 61] }, // D · Dmaj7
      { bass: 43, notes: [59, 62, 66] },
      { bass: 38, notes: [54, 57, 61] }
    ];
    const melody = [78, 81, 79, 78]; // F#5 A5 G5 F#5
    const events: ScoreEvent[] = [];
    chords.forEach((c, b) => {
      const base = b * bar;
      events.push({ step: base, note: c.bass, len: 2.6, peak: 0.24, type: 'sine' });
      c.notes.forEach((n, i) => {
        events.push({ step: base + 3, note: n, len: 2.0, peak: 0.09, type: 'triangle', detune: i === 1 ? 5 : -5 });
      });
      events.push({ step: base, note: melody[b], len: 3.2, peak: 0.18, type: 'triangle' });
    });
    return buildScore(ctx, out, {
      stepMs: 450,
      steps: bar * chords.length,
      bus: 0.055,
      filter: { type: 'lowpass', freq: 2400 },
      events
    });
  },

  moonlight(ctx, out) {
    // Beethoven — Moonlight Sonata, first movement (public domain). Rolling
    // triplet arpeggios in C# minor: the defining soft, restless mood.
    const bar = 12; // eighth-note triplets across 4/4
    const chords = [
      [49, 52, 56, 61], // C#m
      [45, 49, 52, 57], // A
      [52, 56, 59, 64], // E
      [44, 47, 51, 56]  // G#m
    ];
    const pattern = [0, 1, 2, 3, 2, 1];
    const events: ScoreEvent[] = [];
    chords.forEach((c, b) => {
      const base = b * bar;
      for (let i = 0; i < bar; i++) {
        events.push({ step: base + i, note: c[pattern[i % pattern.length]], len: 1.5, peak: 0.13, type: 'sine' });
      }
      events.push({ step: base, note: c[0] - 12, len: 3.4, peak: 0.16, type: 'sine' });
    });
    return buildScore(ctx, out, {
      stepMs: 370,
      steps: bar * chords.length,
      bus: 0.05,
      filter: { type: 'lowpass', freq: 2000 },
      events
    });
  },

  canon(ctx, out) {
    // Pachelbel — Canon in D (public domain). The familiar descending line
    // over gently rolling arpeggios.
    const bar = 8; // eighth notes per 4/4 bar
    const progression = [
      [50, 54, 57, 62], // D
      [45, 49, 52, 57], // A
      [47, 50, 54, 59], // Bm
      [42, 45, 49, 54], // F#m
      [43, 47, 50, 55], // G
      [50, 54, 57, 62], // D
      [43, 47, 50, 55], // G
      [45, 49, 52, 57]  // A
    ];
    const melody = [78, 76, 74, 73, 71, 69, 71, 73];
    const arp = [0, 1, 2, 3, 2, 1, 2, 1];
    const events: ScoreEvent[] = [];
    progression.forEach((notes, b) => {
      const base = b * bar;
      for (let i = 0; i < bar; i++) {
        events.push({ step: base + i, note: notes[arp[i]], len: 1.4, peak: 0.1, type: 'triangle' });
      }
      events.push({ step: base, note: melody[b], len: 3.0, peak: 0.16, type: 'sine' });
    });
    return buildScore(ctx, out, {
      stepMs: 470,
      steps: bar * progression.length,
      bus: 0.05,
      filter: { type: 'lowpass', freq: 2600 },
      events
    });
  },

  cinematic(ctx, out) {
    // Original piece in the Einaudi / "Experience" spirit: a repeating minimal
    // arpeggio over a vi–IV–I–V progression. Written for this app.
    const bar = 8;
    const progression = [
      { bass: 45, notes: [57, 60, 64, 69] }, // Am
      { bass: 41, notes: [53, 57, 60, 65] }, // F
      { bass: 48, notes: [52, 55, 60, 64] }, // C
      { bass: 43, notes: [55, 59, 62, 67] }  // G
    ];
    const melody = [76, 72, 67, 74]; // E5 C5 G4 D5 — original motif
    const arp = [0, 1, 2, 3, 1, 2, 3, 2];
    const events: ScoreEvent[] = [];
    progression.forEach((c, b) => {
      const base = b * bar;
      for (let i = 0; i < bar; i++) {
        events.push({ step: base + i, note: c.notes[arp[i]], len: 1.8, peak: 0.11, type: 'sine' });
      }
      events.push({ step: base, note: c.bass, len: 2.8, peak: 0.18, type: 'sine' });
      events.push({ step: base, note: melody[b], len: 3.4, peak: 0.16, type: 'triangle' });
    });
    return buildScore(ctx, out, {
      stepMs: 430,
      steps: bar * progression.length,
      bus: 0.055,
      filter: { type: 'lowpass', freq: 2600 },
      events
    });
  },

  cinematicStrings(ctx, out) {
    // Original in the Zimmer / "Time" spirit: slow swelling string pads over a
    // i–VI–III–VII progression. Written for this app.
    const bar = 8;
    const progression = [
      [50, 53, 57, 62], // Dm
      [46, 50, 53, 58], // Bb
      [41, 45, 48, 53], // F
      [48, 52, 55, 60]  // C
    ];
    const events: ScoreEvent[] = [];
    progression.forEach((notes, b) => {
      const base = b * bar;
      notes.forEach((n, i) => {
        // Two slightly detuned voices per note thicken the pad.
        events.push({ step: base, note: n, len: 5, peak: 0.06, attack: 1.1, type: 'triangle', detune: -6 });
        events.push({ step: base, note: n, len: 5, peak: 0.06, attack: 1.1, type: 'triangle', detune: 6 });
        if (i === 0) events.push({ step: base, note: n - 12, len: 5.2, peak: 0.1, attack: 1.2, type: 'sine' });
      });
      // A soft bell-like motif on the second half of each chord.
      events.push({ step: base + 4, note: notes[2] + 12, len: 2.6, peak: 0.05, type: 'sine' });
    });
    return buildScore(ctx, out, {
      stepMs: 600,
      steps: bar * progression.length,
      bus: 0.07,
      filter: { type: 'lowpass', freq: 1200 },
      events
    });
  },

  nocturne(ctx, out) {
    // Original Chopin-inspired nocturne: flowing left-hand arpeggios with a
    // quiet, singing melody. Written for this app.
    const bar = 8;
    const progression = [
      { bass: 40, notes: [52, 55, 59, 64] }, // Em
      { bass: 36, notes: [48, 52, 55, 60] }, // C
      { bass: 43, notes: [55, 59, 62, 67] }, // G
      { bass: 38, notes: [50, 54, 57, 62] }  // D
    ];
    const melody = [71, 72, 74, 69]; // B4 C5 D5 A4 — original motif
    const arp = [0, 1, 2, 3, 2, 1, 2, 3];
    const events: ScoreEvent[] = [];
    progression.forEach((c, b) => {
      const base = b * bar;
      for (let i = 0; i < bar; i++) {
        events.push({ step: base + i, note: c.notes[arp[i]], len: 1.7, peak: 0.09, type: 'sine' });
      }
      events.push({ step: base, note: c.bass, len: 2.6, peak: 0.16, type: 'sine' });
      events.push({ step: base + 1, note: melody[b], len: 3.2, peak: 0.14, type: 'triangle' });
    });
    return buildScore(ctx, out, {
      stepMs: 480,
      steps: bar * progression.length,
      bus: 0.05,
      filter: { type: 'lowpass', freq: 2400 },
      events
    });
  },

  beats(ctx, out) {
    // Straight 75 BPM study beat: four-on-the-floor-ish kick, crisp hats, a
    // muted bass pulse and sparse chord stabs. No vocals, no drama.
    const stops: Array<() => void> = [];
    const stepMs = 200; // 75 BPM sixteenths
    const stopLoop = scheduleLoop(ctx, stepMs, 16, (step, time) => {
      if (step === 0 || step === 6 || step === 10) {
        strike(ctx, out, { freq: 58, type: 'sine', peak: 0.18, decay: 0.26, at: time });
      }
      if (step === 4 || step === 12) {
        noiseHit(ctx, out, { type: 'bandpass', freq: 1700, q: 0.8, peak: 0.06, decay: 0.16, at: time });
      }
      if (step % 2 === 0) {
        noiseHit(ctx, out, { type: 'highpass', freq: 7000, peak: 0.018, decay: 0.045, at: time });
      }
      if (step === 2 || step === 8 || step === 14) {
        strike(ctx, out, { freq: 110, type: 'sawtooth', peak: 0.05, decay: 0.18, at: time, filter: { type: 'lowpass', freq: 700, q: 4 } });
      }
      if (step === 0 || step === 8) {
        strike(ctx, out, { freq: 349.23, type: 'triangle', peak: 0.05, decay: 0.5, at: time });
        strike(ctx, out, { freq: 440.0, type: 'triangle', peak: 0.04, decay: 0.5, at: time + 0.02 });
      }
    });
    stops.push(stopLoop);
    return () => stops.forEach((s) => s());
  },

  guitar(ctx, out) {
    // Ambient guitar: a slow fingerpicked arpeggio with long sustain and a
    // soft high-end rolloff so it sits behind thought.
    const stops: Array<() => void> = [];
    const bus = ctx.createGain();
    bus.gain.value = 0.06;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2600;
    bus.connect(tone);
    tone.connect(out);
    stops.push(() => {
      bus.disconnect();
      tone.disconnect();
    });

    // E minor-ish arpeggio pattern with a moving top voice.
    const patterns = [
      [164.81, 246.94, 329.63, 392.0, 329.63, 246.94],
      [146.83, 220.0, 293.66, 369.99, 293.66, 220.0],
      [130.81, 196.0, 261.63, 329.63, 261.63, 196.0],
      [146.83, 220.0, 293.66, 349.23, 293.66, 220.0]
    ];
    let bar = 0;
    const stepMs = 375; // 40 BPM eighths
    const stopLoop = scheduleLoop(ctx, stepMs, 12, (step, time) => {
      const pattern = patterns[bar % patterns.length];
      strike(ctx, bus, { freq: pattern[step % pattern.length], type: 'triangle', peak: 0.28, attack: 0.01, decay: 1.6, at: time });
      if (step === 11) bar += 1;
    });
    stops.push(stopLoop);
    return () => stops.forEach((s) => s());
  },

  focuswave(ctx, out) {
    // Alpha binaural-style pulse: a warm drone amplitude-modulated at 8 Hz,
    // plus a slow shimmer, for a steady calming rhythm.
    const stops: Array<() => void> = [];
    const droneBus = ctx.createGain();
    droneBus.gain.value = 0.05;
    droneBus.connect(out);
    stops.push(() => droneBus.disconnect());

    stops.push(connectDrone(ctx, droneBus, [110.0, 164.81, 220.0], 0.16));
    // The 8 Hz pulse is what gives the "alpha" character.
    stops.push(connectLfo(ctx, droneBus.gain, 8, 0.025));
    // Slow breathing shimmer on top.
    stops.push(connectLfo(ctx, droneBus.gain, 0.12, 0.01));
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