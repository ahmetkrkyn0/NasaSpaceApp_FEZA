/**
 * Timeline playback: moves the selected moment forward while playing. The store is written a
 * few times per second at most, because every change is mirrored in the address bar.
 */

import { useEffect, useState } from 'react';
import { scenarioStore } from '../../state/scenario-store';
import { selectedMsOf, windowOf } from './data';
import { MS_PER_HOUR, toUtc } from './time';

/** Playback speeds: simulated hours per real second. Interface settings, not results. */
export const PLAYBACK_SPEEDS = [1, 6, 24] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Real time between two playback steps. */
export const PLAYBACK_TICK_MS = 500;

/** Next selected moment of one playback step, and whether playback reached the window end. */
export function playbackStep(currentMs: number, endMs: number, speed: PlaybackSpeed): { ms: number; done: boolean } {
  const next = currentMs + speed * MS_PER_HOUR * (PLAYBACK_TICK_MS / 1000);
  return next >= endMs ? { ms: endMs, done: true } : { ms: next, done: false };
}

export interface Playback {
  playing: boolean;
  speed: PlaybackSpeed;
  toggle: () => void;
  stop: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
}

export function usePlayback(): Playback {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(PLAYBACK_SPEEDS[1]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      const state = scenarioStore.getState();
      const window = windowOf(state.active);
      const current = selectedMsOf(state);
      if (!window || current === null) {
        setPlaying(false);
        return;
      }
      const step = playbackStep(current, window.endMs, speed);
      scenarioStore.setSelectedUtc(toUtc(step.ms));
      if (step.done) setPlaying(false);
    }, PLAYBACK_TICK_MS);
    return () => clearInterval(timer);
  }, [playing, speed]);

  return {
    playing,
    speed,
    toggle: () => {
      if (!playing) {
        // From the end, playing starts again at the window start.
        const state = scenarioStore.getState();
        const window = windowOf(state.active);
        const current = selectedMsOf(state);
        if (window && current !== null && current >= window.endMs) scenarioStore.setSelectedUtc(toUtc(window.startMs));
      }
      setPlaying(!playing);
    },
    stop: () => setPlaying(false),
    setSpeed,
  };
}
