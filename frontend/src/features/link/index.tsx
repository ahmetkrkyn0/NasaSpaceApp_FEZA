import { getEarthLink } from '../../api/client';
import { formatUtc } from '../../api/format';
import type { EarthLink, LinkMode, Scenario, StationLink, UtcString } from '../../api/types';
import { useStore } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { momentIn } from '../../state/scenario-tools';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { RELAY_EXAMPLE } from '../comms/relay';
import { AsyncBlock, ExampleNote, NeedsScenario, PanelHeader, useRequest } from '../setup/shared';
import {
  DIAGRAM_NOTE,
  MODE_LABEL,
  RELAY_ILLUSTRATION,
  bandSegments,
  earthLinkRequest,
  linkSentence,
  markerAt,
  stationsAt,
  windowAt,
} from './link';
import '../comms/stations.css';
import './link.css';

/**
 * Earth link view (issue #110): who can talk to Earth at the selected moment, and over the
 * period. The full view sits in the Plan door's Earth link panel; Explore and Classroom show a
 * summary. Station numbers carry their reliability label; drawings are labelled as such.
 */

/** Schematic of site, Moon, Earth and the three stations; the state at the moment is highlighted. */
export function LinkDiagram({ mode, link, inView }: { mode: LinkMode | null; link: EarthLink; inView: readonly StationLink[] }) {
  const on = new Set(inView.map((s) => s.id));
  const stations = link.stations.slice(0, 3);
  const angles = [-50, 0, 50];
  return (
    <figure className="link-diagram" aria-label={`Link diagram: ${mode ? MODE_LABEL[mode] : 'no state'}`}>
      <svg viewBox="0 0 320 150" role="img" aria-labelledby="link-diagram-title">
        <title id="link-diagram-title">{mode ? MODE_LABEL[mode] : 'Outside the period'}</title>
        <circle className="link-moon" cx="60" cy="100" r="40" />
        <text className="link-label" x="60" y="146" textAnchor="middle">
          Moon
        </text>
        <circle className="link-site" cx="60" cy="60" r="4" />
        <text className="link-label" x="72" y="56">
          Site
        </text>
        <circle className="link-earth" cx="255" cy="75" r="28" />
        <text className="link-label" x="255" y="122" textAnchor="middle">
          Earth
        </text>
        {stations.map((s, i) => {
          const a = ((angles[i] ?? 0) * Math.PI) / 180;
          const x = 255 - 28 * Math.cos(a);
          const y = 75 + 28 * Math.sin(a);
          return (
            <g key={s.id} className={on.has(s.id) ? 'link-station link-station-on' : 'link-station'}>
              <circle cx={x} cy={y} r="4" />
              <text className="link-label" x={x - 8} y={y + (i === 0 ? -6 : i === 2 ? 14 : 4)} textAnchor="end">
                {s.name}
              </text>
            </g>
          );
        })}
        {mode === 'direct' ? <line className="link-path link-path-direct" x1="64" y1="58" x2="226" y2="72" /> : null}
        {mode === 'no_station' ? <line className="link-path link-path-blocked" x1="64" y1="58" x2="226" y2="72" /> : null}
        {mode === 'relay_needed' ? (
          <g className="link-relay">
            <path className="link-path link-path-relay" d="M 62 56 Q 150 -10 232 60" />
            <rect className="link-relay-sat" x="144" y="18" width="12" height="8" />
          </g>
        ) : null}
      </svg>
      <figcaption className="d-muted">
        {DIAGRAM_NOTE}
        {mode === 'relay_needed' ? (
          <>
            {' '}
            <span className="d-illustration">Illustration</span>: {RELAY_ILLUSTRATION}.
          </>
        ) : null}
      </figcaption>
    </figure>
  );
}

const MODE_CLASS: Record<LinkMode, string> = {
  direct: 'link-seg-direct',
  no_station: 'link-seg-no-station',
  relay_needed: 'link-seg-relay',
};

/** The period as a band of link windows, with the selected moment marked. */
export function LinkBand({ link, utc }: { link: EarthLink; utc: UtcString }) {
  const marker = markerAt(link, utc);
  return (
    <div className="link-band-wrap">
      <div className="link-band" role="list" aria-label="Link windows over the period">
        {bandSegments(link).map(({ window: w, left, width }) => (
          <span
            key={`${w.start_utc}-${w.mode}`}
            role="listitem"
            className={`link-seg ${MODE_CLASS[w.mode]}`}
            style={{ left: `${left}%`, width: `${width}%` }}
            title={`${MODE_LABEL[w.mode]}: ${formatUtc(w.start_utc)} to ${formatUtc(w.end_utc)}`}
            aria-label={`${MODE_LABEL[w.mode]} from ${formatUtc(w.start_utc)} to ${formatUtc(w.end_utc)}`}
          />
        ))}
        {marker !== null ? <span className="link-marker" style={{ left: `${marker}%` }} aria-hidden="true" /> : null}
      </div>
      <p className="link-legend">
        {(['direct', 'no_station', 'relay_needed'] as const).map((m) => (
          <span key={m} className="link-legend-item">
            <span className={`link-swatch ${MODE_CLASS[m]}`} aria-hidden="true" /> {MODE_LABEL[m]}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Computed station view: in view at the moment, and the share of the period. */
export function StationCards({ link, utc }: { link: EarthLink; utc: UtcString }) {
  const on = new Set(stationsAt(link, utc).map((s) => s.id));
  return (
    <ul className="link-stations" aria-label="Stations">
      {link.stations.map((s) => (
        <li key={s.id} className={on.has(s.id) ? 'd-card link-card link-card-on' : 'd-card link-card'}>
          <p className="d-card-title">
            {s.name} {on.has(s.id) ? <span className="link-now">sees the Moon now</span> : null}
          </p>
          <p>
            Sees the Moon <span className="data">{(s.in_view_fraction * 100).toFixed(1)} %</span> of the period{' '}
            <ValidityBadge validity={link.validity} />
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Assumptions and the station elevation limit, as the server gives them. */
function Assumptions({ link }: { link: EarthLink }) {
  return (
    <ul className="d-list" aria-label="Assumptions">
      <li className="d-muted">
        Station elevation limit <span className="data">{link.min_station_elevation_deg}°</span>{' '}
        <ValidityBadge validity="SYNTHETIC" note="assumed" />
      </li>
      {link.assumptions.map((text) => (
        <li key={text} className="d-muted">
          {text}
        </li>
      ))}
    </ul>
  );
}

export function LinkBody({ link, utc, full }: { link: EarthLink; utc: UtcString; full: boolean }) {
  const w = windowAt(link, utc);
  const mode = w?.mode ?? null;
  return (
    <div className="link-view">
      <p className={mode === null ? 'd-note' : `d-note link-state link-state-${mode}`} role="status">
        {mode ? <strong>{MODE_LABEL[mode]}. </strong> : null}
        {linkSentence(link, utc)}
      </p>
      <LinkDiagram mode={mode} link={link} inView={stationsAt(link, utc)} />
      {mode === 'relay_needed' ? (
        <p className="d-muted">
          {RELAY_EXAMPLE.text} ({RELAY_EXAMPLE.source.label})
        </p>
      ) : null}
      <LinkBand link={link} utc={utc} />
      {full ? (
        <>
          <StationCards link={link} utc={utc} />
          <Assumptions link={link} />
        </>
      ) : null}
    </div>
  );
}

/** The view for a scenario and moment, fetched from `/api/earth-link`. */
export function EarthLinkView({ scenario, utc, full }: { scenario: Scenario; utc: UtcString; full: boolean }) {
  const link = useRequest(getEarthLink, earthLinkRequest(scenario));
  return (
    <div className="d-section">
      <h3 className="d-section-title">Link to Earth</h3>
      <AsyncBlock result={link}>{(data) => <LinkBody link={data} utc={utc} full={full} />}</AsyncBlock>
    </div>
  );
}

/** Summary for the Explore and Classroom doors. */
export default function LinkPanel() {
  const scenario = useStore(scenarioStore, (s) => s.active);
  const selected = useStore(scenarioStore, (s) => s.selected_utc);
  return (
    <section className="d-panel" aria-label="Earth link summary">
      <PanelHeader title="Talking to Earth" />
      <ExampleNote />
      {scenario ? <EarthLinkView scenario={scenario} utc={momentIn(scenario, selected)} full={false} /> : <NeedsScenario />}
    </section>
  );
}
