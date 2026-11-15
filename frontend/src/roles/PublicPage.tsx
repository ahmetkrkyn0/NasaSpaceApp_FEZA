import { useState } from 'react';
import { ROLE_SITES, daysText, percent, sampleAt, sampleLabel, type RoleSite } from './data';
import { RoleHead, ValidityBadge } from './parts';

const W = 760;
const H = 330;
const HORIZON_Y = 250;
const SKY_TOP = 34;
const LEFT = 30;
const SPAN = W - 2 * LEFT;

function xOf(azimuth: number): number {
  return LEFT + (((azimuth % 360) + 360) % 360) / 360 * SPAN;
}

/** Height scale: the highest elevation of the month reaches the top of the sky. */
function scaleOf(site: RoleSite): number {
  let top = 12;
  for (let i = 0; i < site.samples.length; i += 1) {
    const s = sampleAt(site, i);
    top = Math.max(top, s.sunElevation, s.earthElevation);
  }
  return (HORIZON_Y - SKY_TOP) / top;
}

function yOf(elevation: number, scale: number): number {
  return Math.min(H + 40, HORIZON_Y - elevation * scale);
}

/** Dotted month-long path of a body, split where the azimuth wraps around north. */
function trackPath(site: RoleSite, scale: number, body: 'sun' | 'earth'): string {
  let path = '';
  let lastX: number | null = null;
  for (let i = 0; i < site.samples.length; i += 1) {
    const s = sampleAt(site, i);
    const x = xOf(body === 'sun' ? s.sunAzimuth : s.earthAzimuth);
    const y = yOf(body === 'sun' ? s.sunElevation : s.earthElevation, scale);
    const jump = lastX === null || Math.abs(x - lastX) > SPAN / 2;
    path += `${jump ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
    lastX = x;
  }
  return path.trim();
}

/** Horizon line from the horizon angles the server gave along the bodies' azimuths. */
function horizonPath(site: RoleSite, scale: number): string {
  const points: [number, number][] = [];
  for (let i = 0; i < site.samples.length; i += 1) {
    const s = sampleAt(site, i);
    points.push([xOf(s.sunAzimuth), yOf(s.sunHorizon, scale)], [xOf(s.earthAzimuth), yOf(s.earthHorizon, scale)]);
  }
  points.sort((a, b) => a[0] - b[0]);
  const first = points[0]?.[1] ?? HORIZON_Y;
  const last = points[points.length - 1]?.[1] ?? HORIZON_Y;
  const line = points.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return `M0 ${first.toFixed(1)} ${line} L${W} ${last.toFixed(1)} L${W} ${H} L0 ${H} Z`;
}

function story(site: RoleSite): string {
  const m = site.metrics;
  if (site.relay_status === 'required') {
    return `Earth never rises here. A lander at ${site.name} needs a relay satellite to talk home.`;
  }
  if (m.max_sun_elevation_deg < 15) {
    return `The Sun never climbs above ${m.max_sun_elevation_deg.toFixed(1)}° at ${site.name}. It circles low on the horizon, so hills can hide it.`;
  }
  return `At ${site.name} the Sun climbs to ${m.max_sun_elevation_deg.toFixed(0)}° and Earth stays in the sky all month. Night still lasts ${daysText(m.longest_dark_hours)}.`;
}

export function PublicPage() {
  const [siteId, setSiteId] = useState(ROLE_SITES[0]?.id ?? '');
  const [step, setStep] = useState(60);
  const site = ROLE_SITES.find((s) => s.id === siteId) ?? ROLE_SITES[0];
  if (!site) return null;
  const scale = scaleOf(site);
  const now = sampleAt(site, step);
  const sunUp = now.sunVisible > 0;
  const earthUp = now.earthVisible > 0;

  return (
    <>
      <RoleHead
        role="public"
        title="Where are the Sun and Earth right now?"
        lead="Pick a landing site and slide through a month on the Moon."
        cta="Open the live explorer"
      />
      <div className="rp-chips" role="group" aria-label="Landing site">
        {ROLE_SITES.map((s) => (
          <button key={s.id} type="button" className="rp-chip" aria-pressed={s.id === site.id} onClick={() => setSiteId(s.id)}>
            <strong>{s.name}</strong>
            <span>{s.place}</span>
          </button>
        ))}
      </div>

      <section className="rp-panel rp-sky" aria-label="Sky view">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Sun and Earth above the horizon at ${site.name}, ${sampleLabel(site, step)}`}>
          <path className="rp-svg-track rp-svg-track-sun" d={trackPath(site, scale, 'sun')} />
          <path className="rp-svg-track rp-svg-track-earth" d={trackPath(site, scale, 'earth')} />
          <circle className={`rp-svg-earth${earthUp ? '' : ' rp-svg-down'}`} cx={xOf(now.earthAzimuth)} cy={yOf(now.earthElevation, scale)} r="17" />
          <circle className={`rp-svg-sun${sunUp ? '' : ' rp-svg-down'}`} cx={xOf(now.sunAzimuth)} cy={yOf(now.sunElevation, scale)} r="13" />
          <path className="rp-svg-ground" d={horizonPath(site, scale)} />
          {['N', 'E', 'S', 'W', 'N'].map((label, i) => (
            <text key={`${label}${i}`} className="rp-svg-compass" x={LEFT + (i / 4) * SPAN} y={H - 12} textAnchor="middle">
              {label}
            </text>
          ))}
        </svg>
        <div className="rp-sky-side">
          <p className="rp-time">{sampleLabel(site, step)}</p>
          <p className={`rp-state ${sunUp ? 'rp-state-on' : 'rp-state-off'}`}>{sunUp ? 'The Sun is up' : 'The Sun is below the horizon'}</p>
          <p className={`rp-state ${earthUp ? 'rp-state-on' : 'rp-state-off'}`}>{earthUp ? 'Earth is in view' : 'Earth is out of view'}</p>
          <label className="rp-slider">
            <span>Move through the month</span>
            <input type="range" min={0} max={site.samples.length - 1} value={step} onChange={(e) => setStep(Number(e.target.value))} />
          </label>
          <p className="rp-fine">
            {site.horizon === 'terrain' ? 'Horizon from the LOLA height map.' : 'Flat horizon, an assumption.'} Disk sizes are enlarged.
          </p>
        </div>
      </section>

      <p className="rp-story">{story(site)}</p>

      <ul className="rp-stats">
        <li>
          <strong>{percent(site.metrics.sunlit_fraction)}</strong>
          <span>of the month in sunlight</span>
        </li>
        <li>
          <strong>{percent(site.metrics.earth_visible_fraction)}</strong>
          <span>of the month with Earth in view</span>
        </li>
        <li>
          <strong>{daysText(site.metrics.longest_dark_hours)}</strong>
          <span>longest stretch without sunlight</span>
        </li>
        <li>
          <strong>{site.metrics.max_sun_elevation_deg.toFixed(1)}°</strong>
          <span>highest the Sun gets</span>
        </li>
      </ul>
      <p className="rp-fine">
        Numbers are <ValidityBadge value={site.validity.events} /> for December 2026, mast height {site.mast_height_m} m.
      </p>
    </>
  );
}
