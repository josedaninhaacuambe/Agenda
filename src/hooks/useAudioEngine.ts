import { useRef, useCallback } from 'react';

type AlertLevel = 'urgent' | 'important' | 'reminder' | 'deadline30' | 'deadline5' | 'overdue' | 'success';

const VIBRATE_PATTERNS: Record<AlertLevel, number[]> = {
  urgent:    [400, 100, 400, 100, 600],
  important: [200, 100, 200],
  reminder:  [100, 50, 100],
  deadline30:[300, 100, 300, 100, 300],
  deadline5: [200, 50, 200, 50, 200, 50, 400],
  overdue:   [800, 150, 500, 150, 800],
  success:   [60, 40, 60, 40, 60],
};

/* ── Tone shapes ───────────────────────────────────────────────── */
function playNote(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  const now  = ctx.currentTime;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now + start);

  gain.gain.setValueAtTime(0,      now + start);
  gain.gain.linearRampToValueAtTime(volume, now + start + 0.015); // fast attack
  gain.gain.setValueAtTime(volume, now + start + duration - 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now + start);
  osc.stop(now + start + duration + 0.01);
}

/* ── Sound recipes ─────────────────────────────────────────────── */
const SOUNDS: Record<AlertLevel, (ctx: AudioContext) => void> = {

  /* 🔴 Urgente — siren: sharp, impossible to ignore */
  urgent: (ctx) => {
    for (let i = 0; i < 3; i++) {
      playNote(ctx, 880, i * 0.45,       0.35, 0.85, 'sawtooth');
      playNote(ctx, 440, i * 0.45 + 0.2, 0.2,  0.6,  'square');
    }
    // Final bass boom
    playNote(ctx, 110, 1.4, 0.5, 0.9, 'square');
  },

  /* 🔵 Importante — ascending executive chime */
  important: (ctx) => {
    const notes = [523, 659, 784, 1047]; // C E G C (major)
    notes.forEach((f, i) => playNote(ctx, f, i * 0.22, 0.45, 0.55 - i * 0.05));
  },

  /* 🔔 Lembrete — gentle double ping */
  reminder: (ctx) => {
    playNote(ctx, 784, 0,    0.3, 0.35);
    playNote(ctx, 880, 0.35, 0.4, 0.25);
  },

  /* ⚠️ Prazo em 30min — descending two-tone warning */
  deadline30: (ctx) => {
    for (let i = 0; i < 2; i++) {
      playNote(ctx, 880, i * 0.5,       0.25, 0.7, 'triangle');
      playNote(ctx, 659, i * 0.5 + 0.3, 0.2,  0.5, 'triangle');
    }
  },

  /* 🚨 Prazo em 5min — rapid escalating alarm */
  deadline5: (ctx) => {
    [440, 523, 659, 784, 880].forEach((f, i) =>
      playNote(ctx, f, i * 0.12, 0.1, 0.7 + i * 0.05, 'sawtooth')
    );
    // Then repeat inverted
    [880, 784, 659].forEach((f, i) =>
      playNote(ctx, f, 0.7 + i * 0.1, 0.08, 0.9, 'square')
    );
  },

  /* 💀 Prazo ultrapassado — low descending doom */
  overdue: (ctx) => {
    [220, 196, 165, 147].forEach((f, i) =>
      playNote(ctx, f, i * 0.3, 0.5, 0.9 - i * 0.05, 'square')
    );
    playNote(ctx, 110, 1.3, 1.0, 1.0, 'sawtooth');
  },

  /* ✅ Concluída — dopamine reward fanfare */
  success: (ctx) => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      playNote(ctx, f, i * 0.1, 0.25, 0.4 - i * 0.02)
    );
  },
};

/* ─────────────────────────────────────────────────────────────── */
export function useAudioEngine() {
  const ctxRef = useRef<AudioContext | null>(null);

  // iOS requires AudioContext created after user gesture
  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      // Resume if suspended (iOS auto-suspends)
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume();
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  const vibrate = useCallback((level: AlertLevel) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(VIBRATE_PATTERNS[level] ?? [100]);
    }
  }, []);

  const play = useCallback((level: AlertLevel) => {
    const ctx = getCtx();
    if (ctx) {
      try { SOUNDS[level](ctx); } catch { /* audio not supported */ }
    }
    vibrate(level);
  }, [getCtx, vibrate]);

  // Pre-warm the AudioContext on first user interaction
  const prewarm = useCallback(() => { getCtx(); }, [getCtx]);

  return { play, prewarm };
}
