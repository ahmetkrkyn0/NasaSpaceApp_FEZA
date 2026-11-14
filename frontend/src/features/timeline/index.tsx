import { useMemo, useRef, useState } from 'react';
import { scenarioStore } from '../../state/scenario-store';
import { describeError } from './describe-error';
import { roundToMinute, useEvents, useHealth, useScenario } from './data';
import { jumpAllowed, planJump, type JumpKind } from './jumps';
import { usePlayback } from './playback';
import { toUtc } from './time';
import { TimelineView } from './TimelineView';

/** Store writes while dragging are spaced at least this far apart; the release always writes. */
export const SCRUB_COMMIT_MS = 250;

/** Timeline panel: bands from `/api/events`, cursor, drag, playback and jumps. */
export default function TimelinePanel() {
  const { active, window, selectedMs } = useScenario();
  const events = useEvents(active);
  const health = useHealth();
  const playback = usePlayback();
  const [previewMs, setPreviewMs] = useState<number | null>(null);
  const lastCommit = useRef(0);
  const healthData = health.data ?? null;

  const disabledJumps = useMemo(() => {
    const out = new Set<string>();
    if (!active || !window || selectedMs === null) return out;
    for (const kind of ['lunar_day', 'month'] as const) {
      for (const direction of [1, -1] as const) {
        if (!jumpAllowed(planJump(active, window, selectedMs, kind, direction), window, healthData)) {
          out.add(`${kind}:${direction}`);
        }
      }
    }
    return out;
    // window is derived from active; its bounds are covered by `active`.
  }, [active, selectedMs, healthData]);

  if (!active || !window || selectedMs === null) {
    return (
      <section className="tl-panel" aria-label="Timeline">
        <h2 className="panel-kicker">Timeline</h2>
        <p className="tl-note">No scenario selected.</p>
      </section>
    );
  }

  const commit = (ms: number) => {
    lastCommit.current = Date.now();
    scenarioStore.setSelectedUtc(toUtc(roundToMinute(ms)));
  };

  const onScrub = (ms: number, final: boolean) => {
    playback.stop();
    if (final) {
      setPreviewMs(null);
      commit(ms);
      return;
    }
    setPreviewMs(ms);
    if (Date.now() - lastCommit.current >= SCRUB_COMMIT_MS) commit(ms);
  };

  const onJump = (kind: JumpKind, direction: 1 | -1) => {
    playback.stop();
    const result = planJump(active, window, selectedMs, kind, direction);
    if (result.scenario) scenarioStore.setScenario(result.scenario);
    scenarioStore.setSelectedUtc(toUtc(result.selectedMs));
  };

  return (
    <section className="tl-panel" aria-label="Timeline">
      <h2 className="panel-kicker">Timeline</h2>
      <TimelineView
        window={window}
        selectedMs={previewMs ?? selectedMs}
        events={events.data ?? null}
        eventsNote={events.status === 'error' ? describeError(events.error) : null}
        playing={playback.playing}
        speed={playback.speed}
        onTogglePlay={playback.toggle}
        onSpeed={playback.setSpeed}
        onScrub={onScrub}
        onJump={onJump}
        disabledJumps={disabledJumps}
      />
    </section>
  );
}
