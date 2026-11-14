import { useId, useState } from 'react';
import type { HorizonProfile, SkySample, SkySeries } from '../../api/types';
import { SourcePopover, type SourceDetail } from '../../ui/SourcePopover';
import { ECLIPSE_EXPLANATION, eclipseTimesText, obscuredText, type EclipseSpan } from '../timeline/eclipse';
import { formatUtc, parseUtc } from '../timeline/time';
import {
  diskState,
  elevationDomain,
  horizonNote,
  nearestSample,
  niceTicks,
  partialText,
  pathRuns,
  wrapAzimuth,
  type Point,
} from './geometry';
import './sky.css';

/** Drawing size in SVG units; the strip scales to the panel width. */
const WIDTH = 720;
const HEIGHT = 220;
const PAD_LEFT = 40;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 26;
/** Marker radius when the server gives no apparent size. */
const MARKER_RADIUS = 5;

const COMPASS: readonly { az: number; label: string }[] = [
  { az: 0, label: 'N' },
  { az: 90, label: 'E' },
  { az: 180, label: 'S' },
  { az: 270, label: 'W' },
  { az: 360, label: 'N' },
];

type Body = 'sun' | 'earth';
const BODY_LABEL: Record<Body, string> = { sun: 'Sun', earth: 'Earth' };

export interface SkyStripProps {
  horizon: HorizonProfile;
  series: SkySeries;
  /** Selected moment in milliseconds. */
  selectedMs: number;
  /** The sky-series request was shortened to the endpoint limit. */
  capped?: boolean;
  /** Eclipse under the selected moment, from the `/api/events` answer. */
  eclipse?: EclipseSpan | null;
}

/**
 * Note shown while the selected moment lies inside an eclipse. The covered share is the
 * server's maximum for the whole eclipse, never a value computed for the moment.
 */
export type EclipseDrawing = 'overlap' | 'no-size' | 'sample-outside';

const DRAWING_TEXT: Record<EclipseDrawing, string> = {
  overlap:
    'The Earth disk is drawn in front of the Sun at the server positions. The strip axes use different scales, so the overlap is illustrative; the share given here is the server value.',
  'no-size': 'Apparent disk sizes are not available, so the covered part is not drawn.',
  'sample-outside': 'The nearest sample lies outside the eclipse, so no overlap is drawn.',
};

/** Whether the drawn disks can show the covered part: sizes known and the sample inside the eclipse. */
export function eclipseDrawing(eclipse: EclipseSpan, sample: SkySample): EclipseDrawing {
  if (sample.sun.radius_deg === null || sample.earth.radius_deg === null) return 'no-size';
  const ms = parseUtc(sample.utc);
  return ms !== null && ms >= eclipse.startMs && ms <= eclipse.endMs ? 'overlap' : 'sample-outside';
}

export function eclipseNote(eclipse: EclipseSpan, drawing: EclipseDrawing): string {
  return `Eclipse in progress (${eclipseTimesText(eclipse)}): ${ECLIPSE_EXPLANATION} Largest share for this eclipse: ${obscuredText(eclipse.maxObscured)}. ${DRAWING_TEXT[drawing]}`;
}

/** Facts for the source window, read only from the response fields. */
export function skySourceDetails(horizon: HorizonProfile, series: SkySeries): SourceDetail[] {
  const details: SourceDetail[] = [
    { label: 'Horizon method', value: horizon.method === 'terrain' ? 'Terrain (elevation map)' : 'Flat horizon (sphere)' },
  ];
  if (horizon.dem) {
    details.push({ label: 'Elevation map', value: horizon.dem.product });
    details.push({ label: 'Map resolution', value: `${horizon.dem.resolution_m} m` });
  }
  if (horizon.max_range_km !== null) details.push({ label: 'Horizon range', value: `${horizon.max_range_km} km` });
  details.push({ label: 'Mast height', value: `${series.mast_height_m} m` });
  details.push({ label: 'Positions', value: `${series.ephemeris.source}, ${series.ephemeris.frame}, ${series.ephemeris.correction}` });
  return details;
}

function bodyText(body: Body, sample: SkySample): string {
  const s = sample[body];
  const parts = [
    `${BODY_LABEL[body]}`,
    `azimuth ${s.azimuth_true_deg.toFixed(2)}°`,
    `elevation ${s.elevation_deg.toFixed(2)}°`,
    `horizon ${s.horizon_deg.toFixed(2)}°`,
  ];
  const partial = partialText(s.visible_fraction);
  if (partial) parts.push(partial);
  else parts.push(diskState(s.visible_fraction) === 'hidden' ? 'below the horizon' : 'above the horizon');
  return parts.join(' · ');
}

/**
 * Horizon strip (docs/design/gosterim-ve-arayuz.md, "Zorunlu gösterimler" 1): azimuth from
 * north eastwards on the horizontal axis, elevation on the vertical axis. The horizon
 * profile is a filled silhouette; Sun and Earth paths are lines; the selected moment shows
 * each body as a disk, filled when visible, outlined and dim when below the horizon.
 */
export function SkyStrip({ horizon, series, selectedMs, capped = false, eclipse = null }: SkyStripProps) {
  const [hover, setHover] = useState<Body | null>(null);
  const clipId = useId().replace(/:/g, '');
  const domain = elevationDomain(horizon, series);
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const x = (az: number) => PAD_LEFT + (az / 360) * plotW;
  const y = (el: number) => PAD_TOP + ((domain.max - el) / (domain.max - domain.min)) * plotH;
  const pxPerDeg = plotH / (domain.max - domain.min);

  const step = horizon.azimuth_step_deg;
  const silhouette = horizon.horizon_deg.map((el, i) => `${x(i * step).toFixed(2)},${y(el).toFixed(2)}`);
  // Close the profile at 360 with the north value, then down to the bottom edge.
  const northValue = horizon.horizon_deg[0] ?? 0;
  const bottom = (PAD_TOP + plotH).toFixed(2);
  const groundPoints = [
    ...silhouette,
    `${x(360).toFixed(2)},${y(northValue).toFixed(2)}`,
    `${x(360).toFixed(2)},${bottom}`,
    `${x(0).toFixed(2)},${bottom}`,
  ].join(' ');
  const skyPoints = [
    `${x(0).toFixed(2)},${PAD_TOP}`,
    `${x(360).toFixed(2)},${PAD_TOP}`,
    `${x(360).toFixed(2)},${y(northValue).toFixed(2)}`,
    ...[...silhouette].reverse(),
  ].join(' ');

  const nearest = nearestSample(series, selectedMs);
  const note = horizonNote(series.validity, series.horizon.method);
  const ticks = niceTicks(domain.min, domain.max, 4);

  const runPath = (run: Point[]) => run.map((p) => `${x(wrapAzimuth(p.az)).toFixed(2)},${y(p.el).toFixed(2)}`).join(' ');

  const disk = (body: Body, sample: SkySample) => {
    const s = sample[body];
    const state = diskState(s.visible_fraction);
    const r = s.radius_deg !== null ? Math.max(s.radius_deg * pxPerDeg, 2) : MARKER_RADIUS;
    const cx = x(wrapAzimuth(s.azimuth_true_deg));
    const cy = y(s.elevation_deg);
    const label = bodyText(body, sample);
    return (
      <g
        key={body}
        className={`sky-disk sky-disk-${body} sky-disk-${state}${body === 'sun' && eclipse ? ' sky-disk-eclipsed' : ''}`}
        tabIndex={0}
        role="img"
        aria-label={label}
        onPointerEnter={() => setHover(body)}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setHover(body)}
        onBlur={() => setHover(null)}
      >
        <title>{label}</title>
        <circle className="sky-disk-outline" cx={cx} cy={cy} r={r} />
        {state === 'hidden' ? null : (
          <circle
            className="sky-disk-fill"
            cx={cx}
            cy={cy}
            r={r}
            clipPath={state === 'partial' ? `url(#${clipId})` : undefined}
          />
        )}
      </g>
    );
  };

  return (
    <figure className="sky-strip">
      <div className="sky-strip-head">
        <SourcePopover
          validity={series.validity}
          note={note}
          sources={[{ label: series.ephemeris.source }, ...(horizon.dem ? [{ label: horizon.dem.product, url: horizon.dem.url ?? undefined }] : [])]}
          details={skySourceDetails(horizon, series)}
        />
        <span className="sky-strip-legend">
          <span className="sky-key sky-key-sun">Sun</span>
          <span className="sky-key sky-key-earth">Earth</span>
          <span className="sky-key-text">filled: above the horizon · outline: below</span>
        </span>
      </div>
      <svg
        className="sky-strip-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Horizon strip: azimuth from north eastwards, elevation in degrees"
      >
        <defs>
          <clipPath id={clipId}>
            <polygon points={skyPoints} />
          </clipPath>
        </defs>
        {ticks.map((t) => (
          <g key={`el-${t}`} className="sky-grid">
            <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y(t)} y2={y(t)} />
            <text x={PAD_LEFT - 4} y={y(t)} className="sky-axis-text sky-axis-text-el">
              {`${t}°`}
            </text>
          </g>
        ))}
        {COMPASS.map((c) => (
          <g key={`az-${c.az}`} className="sky-grid">
            <line x1={x(c.az)} x2={x(c.az)} y1={PAD_TOP} y2={PAD_TOP + plotH} />
            <text x={x(c.az)} y={HEIGHT - 8} className="sky-axis-text sky-axis-text-az">
              {c.label}
            </text>
          </g>
        ))}
        <polygon className="sky-ground" points={groundPoints} />
        <polyline className="sky-horizon-line" points={[...silhouette, `${x(360).toFixed(2)},${y(northValue).toFixed(2)}`].join(' ')} />
        {(['sun', 'earth'] as const).map((body) =>
          pathRuns(series.samples, body).map((run, i) =>
            run.length > 1 ? <polyline key={`${body}-${i}`} className={`sky-path sky-path-${body}`} points={runPath(run)} /> : null,
          ),
        )}
        {/* Earth is nearer than the Sun, so its disk is drawn last and covers the Sun where they overlap. */}
        {nearest ? (['sun', 'earth'] as const).map((body) => disk(body, nearest.sample)) : null}
      </svg>
      <figcaption className="sky-readout">
        {nearest ? (
          <>
            <span className="sky-readout-time">
              {nearest.outside ? 'Nearest sample: ' : 'Sample: '}
              <span className="sky-data">{formatUtc(nearest.sample.utc)}</span>
            </span>
            {(['sun', 'earth'] as const).map((body) => (
              <span key={body} className={`sky-readout-row${hover === body ? ' is-hover' : ''}`}>
                {bodyText(body, nearest.sample)}
              </span>
            ))}
            {nearest.outside ? (
              <span className="sky-note">The selected moment lies outside the sky series; the closest sample is shown.</span>
            ) : null}
            {nearest.sample.sun.radius_deg === null || nearest.sample.earth.radius_deg === null ? (
              <span className="sky-note">Apparent disk size not available; fixed-size markers are drawn.</span>
            ) : (
              <span className="sky-note">Disk size follows the vertical scale.</span>
            )}
          </>
        ) : (
          <span className="sky-note">The sky series has no samples.</span>
        )}
        {eclipse && nearest ? (
          <span className="sky-note sky-note-eclipse">{eclipseNote(eclipse, eclipseDrawing(eclipse, nearest.sample))}</span>
        ) : null}
        {capped ? <span className="sky-note">The sky series covers the first two months of the scenario.</span> : null}
      </figcaption>
    </figure>
  );
}
