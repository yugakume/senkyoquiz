/*
 * useBGM.ts — Result BGM using Web Audio API
 * Design: Election Broadcast Dashboard
 *
 * Three BGM patterns based on quiz result:
 * - Perfect (100%): Triumphant fanfare — 選挙速報の当確ラッシュ風
 * - Good (60-99%): Bittersweet melody — 惜しかった感じ
 * - Poor (<60%): Melancholic tune — 壊滅的な感じ
 *
 * All sounds generated programmatically using Web Audio API.
 * No external audio files needed.
 */

import { useCallback, useRef } from "react";

export function useBGM() {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  /** 再生中のBGMを停止 */
  const stopBGM = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
  }, []);

  /**
   * 全問正解BGM — 勝利のファンファーレ
   * 明るく華やかな上昇メロディー + 和音
   */
  const playPerfectBGM = useCallback(() => {
    stopBGM();
    try {
      const ctx = getCtx();
      const oscillators: OscillatorNode[] = [];

      // Melody: triumphant ascending fanfare
      // C5 E5 G5 C6 — classic victory progression
      const melody = [
        { freq: 523.25, time: 0.0, dur: 0.25 },    // C5
        { freq: 659.25, time: 0.2, dur: 0.25 },    // E5
        { freq: 783.99, time: 0.4, dur: 0.25 },    // G5
        { freq: 1046.5, time: 0.6, dur: 0.5 },     // C6
        { freq: 783.99, time: 1.1, dur: 0.2 },     // G5
        { freq: 1046.5, time: 1.3, dur: 0.2 },     // C6
        { freq: 1174.66, time: 1.5, dur: 0.6 },    // D6
        { freq: 1318.51, time: 2.1, dur: 1.0 },    // E6 (hold)
      ];

      // Harmony chords underneath
      const chords = [
        { freqs: [261.63, 329.63, 392.0], time: 0.0, dur: 1.0 },  // C major
        { freqs: [261.63, 329.63, 392.0], time: 1.0, dur: 0.5 },  // C major
        { freqs: [293.66, 369.99, 440.0], time: 1.5, dur: 0.6 },  // D minor → G
        { freqs: [261.63, 329.63, 392.0], time: 2.1, dur: 1.2 },  // C major (final)
      ];

      const now = ctx.currentTime;

      // Play melody
      melody.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + time);
        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.3, now + time + 0.02);
        gain.gain.setValueAtTime(0.3, now + time + dur - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + dur + 0.15);
        oscillators.push(osc);
      });

      // Play chords
      chords.forEach(({ freqs, time, dur }) => {
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + time);
          gain.gain.setValueAtTime(0, now + time);
          gain.gain.linearRampToValueAtTime(0.08, now + time + 0.05);
          gain.gain.setValueAtTime(0.08, now + time + dur - 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + time);
          osc.stop(now + time + dur + 0.15);
          oscillators.push(osc);
        });
      });

      // Percussion-like hits
      const hits = [0.0, 0.2, 0.4, 0.6, 1.0, 1.3, 1.5, 2.1];
      hits.forEach((time) => {
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(800, now + time);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now + time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.05);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now + time);
        noise.stop(now + time + 0.06);
      });

      stopRef.current = () => {
        oscillators.forEach((o) => {
          try { o.stop(); } catch {}
        });
      };
    } catch {
      // Silently fail
    }
  }, [getCtx, stopBGM]);

  /**
   * 惜しかったBGM — ビタースイートなメロディー
   * 少し明るいが物悲しさも漂うメロディー
   */
  const playCloseBGM = useCallback(() => {
    stopBGM();
    try {
      const ctx = getCtx();
      const oscillators: OscillatorNode[] = [];
      const now = ctx.currentTime;

      // Bittersweet melody in A minor with major resolution
      // Starts hopeful, slightly melancholic middle, ends with unresolved feel
      const melody = [
        { freq: 440.0,  time: 0.0,  dur: 0.3 },   // A4
        { freq: 523.25, time: 0.3,  dur: 0.3 },   // C5
        { freq: 587.33, time: 0.6,  dur: 0.3 },   // D5
        { freq: 659.25, time: 0.9,  dur: 0.5 },   // E5
        { freq: 587.33, time: 1.4,  dur: 0.3 },   // D5
        { freq: 523.25, time: 1.7,  dur: 0.3 },   // C5
        { freq: 493.88, time: 2.0,  dur: 0.4 },   // B4 (tension)
        { freq: 440.0,  time: 2.4,  dur: 0.8 },   // A4 (resolve but minor)
      ];

      // Soft pad chords
      const chords = [
        { freqs: [220.0, 261.63, 329.63], time: 0.0, dur: 1.2 },  // A minor
        { freqs: [220.0, 277.18, 349.23], time: 1.2, dur: 1.2 },  // A minor 7
        { freqs: [246.94, 293.66, 369.99], time: 2.4, dur: 1.0 }, // B dim
      ];

      melody.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + time);
        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.22, now + time + 0.04);
        gain.gain.setValueAtTime(0.22, now + time + dur - 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + dur + 0.15);
        oscillators.push(osc);
      });

      chords.forEach(({ freqs, time, dur }) => {
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + time);
          gain.gain.setValueAtTime(0, now + time);
          gain.gain.linearRampToValueAtTime(0.07, now + time + 0.1);
          gain.gain.setValueAtTime(0.07, now + time + dur - 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + time);
          osc.stop(now + time + dur + 0.15);
          oscillators.push(osc);
        });
      });

      stopRef.current = () => {
        oscillators.forEach((o) => {
          try { o.stop(); } catch {}
        });
      };
    } catch {
      // Silently fail
    }
  }, [getCtx, stopBGM]);

  /**
   * 壊滅的BGM — 悲しいメロディー
   * ゆっくりとした下降音型、暗い和音
   */
  const playPoorBGM = useCallback(() => {
    stopBGM();
    try {
      const ctx = getCtx();
      const oscillators: OscillatorNode[] = [];
      const now = ctx.currentTime;

      // Descending minor melody — slow and melancholic
      const melody = [
        { freq: 392.0,  time: 0.0,  dur: 0.5 },   // G4
        { freq: 349.23, time: 0.5,  dur: 0.5 },   // F4
        { freq: 311.13, time: 1.0,  dur: 0.5 },   // Eb4
        { freq: 293.66, time: 1.5,  dur: 0.5 },   // D4
        { freq: 261.63, time: 2.0,  dur: 0.6 },   // C4
        { freq: 246.94, time: 2.6,  dur: 0.5 },   // B3
        { freq: 220.0,  time: 3.1,  dur: 1.2 },   // A3 (final low note)
      ];

      // Dark minor chords with dissonance
      const chords = [
        { freqs: [196.0, 233.08, 293.66], time: 0.0, dur: 1.5 },  // G minor
        { freqs: [174.61, 220.0, 261.63], time: 1.5, dur: 1.5 },  // F minor
        { freqs: [164.81, 196.0, 246.94], time: 3.0, dur: 1.5 },  // E minor (dark)
      ];

      // Add a slow vibrato to melody for emotional effect
      melody.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        const gain = ctx.createGain();

        // Vibrato LFO
        vibrato.type = "sine";
        vibrato.frequency.setValueAtTime(4, now + time);
        vibratoGain.gain.setValueAtTime(4, now + time); // ±4Hz vibrato
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + time);
        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.18, now + time + 0.08);
        gain.gain.setValueAtTime(0.18, now + time + dur - 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + dur + 0.25);
        vibrato.start(now + time);
        vibrato.stop(now + time + dur + 0.25);
        oscillators.push(osc, vibrato);
      });

      chords.forEach(({ freqs, time, dur }) => {
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + time);
          gain.gain.setValueAtTime(0, now + time);
          gain.gain.linearRampToValueAtTime(0.06, now + time + 0.15);
          gain.gain.setValueAtTime(0.06, now + time + dur - 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + time);
          osc.stop(now + time + dur + 0.25);
          oscillators.push(osc);
        });
      });

      stopRef.current = () => {
        oscillators.forEach((o) => {
          try { o.stop(); } catch {}
        });
      };
    } catch {
      // Silently fail
    }
  }, [getCtx, stopBGM]);

  /**
   * スコアに基づいてBGMを自動選択して再生
   * @param score 正解数
   * @param total 問題数
   */
  const playResultBGM = useCallback(
    (score: number, total: number) => {
      const pct = total > 0 ? score / total : 0;
      if (pct >= 1.0) {
        playPerfectBGM();
      } else if (pct >= 0.6) {
        playCloseBGM();
      } else {
        playPoorBGM();
      }
    },
    [playPerfectBGM, playCloseBGM, playPoorBGM]
  );

  return {
    playPerfectBGM,
    playCloseBGM,
    playPoorBGM,
    playResultBGM,
    stopBGM,
  };
}
