import type { EventList, NowStatus } from '../../api/types';
import { ExampleDataNote } from '../../api/ExampleDataNote';
import { exampleSource } from '../../api/recorded';
import { SourcePopover } from '../../ui/SourcePopover';
import { HIGH_UNCERTAINTY } from '../timeline/event-range';
import { formatUtc, parseUtc } from '../timeline/time';
import { TERRAIN_NOT_INCLUDED } from '../sky/geometry';
import { buildCountdown } from './countdown';
import './hud.css';

export interface HudViewProps {
  now: NowStatus;
  events: EventList | null;
  /** Selected moment; when the answer is for another moment, that moment is shown. */
  selectedMs: number;
}

const CRITERION_TEXT = { center: 'disk centre', first_limb: 'first limb', full_disk: 'full disk' } as const;

/**
 * The answer whose example note the countdown shows: the first of `now` and `events` that is a
 * general example rather than a recording of this site and period, since both feed the rows.
 * `null` when neither is a fallback example (PR #135 review).
 */
export function fallbackAnswer(now: NowStatus, events: EventList | null): NowStatus | EventList | null {
  return [now, events].find((value) => {
    const source = value ? exampleSource(value) : undefined;
    return source !== undefined && !source.matched;
  }) ?? null;
}

/** Countdown over the map: time to the next sunset or sunrise, Earthset or Earthrise, and night length. */
export function HudView({ now, events, selectedMs }: HudViewProps) {
  const rows = buildCountdown(now, events);
  const answerMs = parseUtc(now.utc);
  const stale = answerMs !== null && answerMs !== selectedMs;
  const fallback = fallbackAnswer(now, events);

  return (
    <div className="hud-view">
      {fallback ? <ExampleDataNote value={fallback} fallbackOnly /> : null}
      <div className="hud-head">
        <SourcePopover
          validity={now.validity}
          note={now.validity === 'SYNTHETIC' ? TERRAIN_NOT_INCLUDED : undefined}
          sources={[]}
          details={[
            { label: 'Earth criterion', value: CRITERION_TEXT[now.criterion] },
            { label: 'Mast height', value: `${now.mast_height_m} m` },
            { label: 'Search limited', value: now.search_limited ? 'yes' : 'no' },
          ]}
        />
      </div>
      <p className={`hud-asof${stale ? ' is-stale' : ''}`}>
        {stale ? 'Values for ' : 'At '}
        <span className="hud-data">{formatUtc(now.utc)}</span>
      </p>
      <dl className="hud-rows">
        {rows.map((row) => (
          <div key={row.key} className="hud-row">
            <dt>{row.label}</dt>
            <dd className={row.status ? 'hud-status' : 'hud-value'}>{row.value}</dd>
            {row.event ? (
              <dd className="hud-event">
                <span className="hud-data">{row.event.time.text}</span>
                {row.event.time.meaning ? <span className="hud-meaning">{row.event.time.meaning}</span> : null}
                {row.event.time.high ? <span className="hud-warning">{HIGH_UNCERTAINTY}</span> : null}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
