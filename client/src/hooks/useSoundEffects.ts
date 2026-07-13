/*
 * useSoundEffects.ts — Sound effects using Web Audio API
 * Design: Election Broadcast Dashboard
 *
 * Generates all sounds programmatically using Web Audio API oscillators.
 * No external audio files needed.
 */

import { useCallback, useRef } from "react";

export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  /** 正解音 — 上昇する明るいチャイム */
  const playCorrect = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // Two-note ascending chime
      const notes = [523.25, 783.99]; // C5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.5);
      });

      // Add a bright shimmer
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = "triangle";
      shimmer.frequency.setValueAtTime(1046.5, now + 0.2); // C6
      shimmerGain.gain.setValueAtTime(0, now + 0.2);
      shimmerGain.gain.linearRampToValueAtTime(0.15, now + 0.22);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmer.start(now + 0.2);
      shimmer.stop(now + 0.8);
    } catch {
      // Silently fail if audio context is not available
    }
  }, [getCtx]);

  /** 不正解音 — 低い2音の下降ブザー */
  const playIncorrect = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // Two descending tones
      const notes = [349.23, 261.63]; // F4, C4
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.4);
      });
    } catch {
      // Silently fail
    }
  }, [getCtx]);

  /** ボタンクリック音 — 短い軽快なタップ音 */
  const playClick = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Silently fail
    }
  }, [getCtx]);

  /** 当確速報音 — 選挙速報風のファンファーレ（正解時に使用） */
  const playTokaku = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // Three-note fanfare: C5 → E5 → G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.02);
        gain.gain.setValueAtTime(0.25, now + i * 0.1 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.6);
      });
    } catch {
      // Silently fail
    }
  }, [getCtx]);

  /** 選択音 — 選択肢を選んだ時の短い確認音 */
  const playSelect = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Silently fail
    }
  }, [getCtx]);

  return {
    playCorrect,
    playIncorrect,
    playClick,
    playTokaku,
    playSelect,
  };
}
