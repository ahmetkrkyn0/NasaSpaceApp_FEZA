import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { EventList } from '../../api/types';
import { SourcePopover } from '../../ui/SourcePopover';
import { TERRAIN_NOT_INCLUDED } from '../sky/geometry';
import { bandSegments, dayTicks, eventMarks, fractionOf, msAt, type BandSegment } from './bands';
import type { ScenarioWindow } from './data';
import { EVENT_LABEL, HIGH_UNCERTAINTY, RANGE_MEANING, eventTimeText } from './event-range';
import type { JumpKind } from './jumps';
import { PLAYBACK_SPEEDS, type PlaybackSpeed } from './playback';
import { MS_PER_MINUTE, formatDate, formatHours, formatUtc, parseUtc } from './time';
import './timeline.css';

export interface TimelineViewProps {
  window: ScenarioWindow;
  selectedMs: number;
  events: EventList | null;
  /** Error or loading text for the events request, shown in place of the bands. */
  eventsNote?: string | null;
  playing: boolean;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onSpeed: (speed: PlaybackSpeed) => void;
  /** `commit` is false while dragging and true on release, click or keyboard. */
  onScrub: (ms: number, commit: boolean) => void;
  onJump: (kind: JumpKind, direction: 1 | -1) => void;
  /** Jumps that would leave the ephemeris range, keyed `lunar_day:1` and so on. */
  disabledJumps?: ReadonlySet<string>;
}

const BAND_TEXT: Record<BandSegment['kind'], string> = {
  sunlit: 'Sunlit',
  dark: 'Dark',
  earth_visible: 'Earth visible',
  earth_hidden: 'Earth hidden',
};

const JUMPS: readonly { kind: JumpKind; direction: 1 | -1; label: string }[] = [
  { kind: 'month', direction: -1, label: '− month' },
  { kind: 'lunar_day', direction: -1, label: '− lunar day' },
  { kind: 'lunar_day', direction: 1, label: '+ lunar day' },
  { kind: 'month', direction: 1, label: '+ month' },
];

function Band({ segments, empty }: { segments: BandSegment[]; empty: string }) {
  if (segments.length === 0) return <span className="tl-band-empty">{empty}</span>;
  return (
    <>
      {segments.map((s) => (
        <span
          key={`${s.kind}-${s.window.start_utc}`}
          className={`tl-seg tl-seg-${s.kind}`}
          style={{ left: `${s.from * 100}%`, width: `${(s.to - s.from) * 100}%` }}
          title={`${BAND_TEXT[s.kind]}: ${formatUtc(s.window.start_utc)} to ${formatUtc(s.window.end_utc)}, ${formatHours(s.window.duration_hours)}`}
        />
      ))}
    </>
  );
}

/**
 * Timeline (docs/design/gosterim-ve-arayuz.md, "Zorunlu gösterimler" 2): a sunlit or dark band,
 * an Earth visible or hidden band, event marks and the selected-moment cursor. Dark and hidden
 * windows are hatched as well as coloured.
 */
export function TimelineView(props: TimelineViewProps) {
  const { window, selectedMs, events, eventsNote, playing, speed, onTogglePlay, onSpeed, onScrub, onJump } = props;
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const cursor = fractionOf(selectedMs, window);
  const marks = events ? eventMarks(events.events, window) : [];
  const anyRange = marks.some((m) => eventTimeText(m.event).meaning !== null);

  const msFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    // The bands column defines the time axis; the row labels sit to its left.
    const rect = trackRef.current?.querySelector('.tl-band')?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return selectedMs;
    return msAt((event.clientX - rect.left) / rect.width, window);
  };

  return (
    <div className="tl-view">
      <div className="tl-controls">
        <button type="button" className="tl-button tl-play" aria-pressed={playing} onClick={onTogglePlay}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <span className="tl-group" role="group" aria-label="Playback speed">
          {PLAYBACK_SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`tl-button${s === speed ? ' is-active' : ''}`}
              aria-pressed={s === speed}
              title={`${s} hour${s === 1 ? '' : 's'} of scenario time per second`}
              onClick={() => onSpeed(s)}
            >
              {`${s} h/s`}
            </button>
          ))}
        </span>
        <span className="tl-group" role="group" aria-label="Jump">
          {JUMPS.map((j) => {
            const key = `${j.kind}:${j.direction}`;
            const disabled = props.disabledJumps?.has(key) ?? false;
            return (
              <button
                key={key}
                type="button"
                className="tl-button"
                disabled={disabled}
                title={disabled ? 'Outside the dates the server can compute' : undefined}
                onClick={() => onJump(j.kind, j.direction)}
              >
                {j.label}
              </button>
            );
          })}
        </span>
        <span className="tl-selected">
          Selected <span className="tl-data">{formatUtc(selectedMs)}</span>
        </span>
        {events ? (
          <SourcePopover
            validity={events.validity}
            note={events.validity === 'SYNTHETIC' ? TERRAIN_NOT_INCLUDED : undefined}
            sources={[]}
            details={[
              { label: 'Mast height', value: `${events.mast_height_m} m` },
              ...(events.events[0] ? [{ label: 'Criterion', value: events.events[0].criterion }] : []),
            ]}
          />
        ) : null}
      </div>

      <div
        ref={trackRef}
        className="tl-track"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('.tl-mark')) return;
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          onScrub(msFromPointer(e), false);
        }}
        onPointerMove={(e) => {
          if (dragging.current) onScrub(msFromPointer(e), false);
        }}
        onPointerUp={(e) => {
          if (!dragging.current) return;
          dragging.current = false;
          onScrub(msFromPointer(e), true);
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <span className="tl-row-label">Sun</span>
        <div className="tl-band">
          {events ? (
            <Band
              segments={bandSegments(events.windows, ['sunlit', 'dark'], window)}
              empty="No sunlit or dark windows in the response"
            />
          ) : (
            <span className="tl-band-empty">{eventsNote ?? 'Loading events…'}</span>
          )}
          <span className="tl-cursor" style={{ left: `${cursor * 100}%` }} aria-hidden="true" />
        </div>
        <span className="tl-row-label">Earth</span>
        <div className="tl-band">
          {events ? (
            <Band
              segments={bandSegments(events.windows, ['earth_visible', 'earth_hidden'], window)}
              empty="No Earth visibility windows in the response"
            />
          ) : null}
          <span className="tl-cursor" style={{ left: `${cursor * 100}%` }} aria-hidden="true" />
        </div>
        <span className="tl-row-label">Events</span>
        <div className="tl-marks">
          {marks.map((m) => {
            const time = eventTimeText(m.event);
            const label = [EVENT_LABEL[m.event.type], time.text, time.meaning, time.high ? HIGH_UNCERTAINTY : null]
              .filter(Boolean)
              .join(', ');
            return (
              <button
                key={`${m.event.type}-${m.event.utc}`}
                type="button"
                className={`tl-mark tl-mark-${m.event.type}${time.high ? ' is-uncertain' : ''}`}
                style={{ left: `${m.at * 100}%` }}
                aria-label={label}
                title={label}
                onClick={() => onScrub(parseUtc(m.event.utc) ?? selectedMs, true)}
              />
            );
          })}
          <span className="tl-cursor" style={{ left: `${cursor * 100}%` }} aria-hidden="true" />
        </div>
        <span className="tl-row-label" aria-hidden="true" />
        <div className="tl-scale" aria-hidden="true">
          {dayTicks(window).map((t) => {
            const at = fractionOf(t, window);
            // Edge labels are anchored inwards so they never overflow the track.
            const anchor = at < 0.08 ? ' is-start' : at > 0.92 ? ' is-end' : '';
            return (
              <span key={t} className={`tl-tick${anchor}`} style={{ left: `${at * 100}%` }}>
                {formatDate(t)}
              </span>
            );
          })}
        </div>
      </div>

      <input
        className="tl-range"
        type="range"
        aria-label="Selected moment"
        aria-valuetext={formatUtc(selectedMs)}
        min={window.startMs}
        max={window.endMs}
        step={MS_PER_MINUTE}
        value={selectedMs}
        onChange={(e) => onScrub(Number(e.currentTarget.value), false)}
        onPointerUp={(e) => onScrub(Number(e.currentTarget.value), true)}
        onKeyUp={(e) => onScrub(Number(e.currentTarget.value), true)}
      />

      <div className="tl-legend">
        <span className="tl-key tl-key-sunlit">Sunlit</span>
        <span className="tl-key tl-key-dark">Dark (hatched)</span>
        <span className="tl-key tl-key-earth_visible">Earth visible</span>
        <span className="tl-key tl-key-earth_hidden">Earth hidden (hatched)</span>
      </div>
      {anyRange ? <p className="tl-note">Event times with two values: {RANGE_MEANING}.</p> : null}
    </div>
  );
}
