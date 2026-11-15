import { useState } from 'react';
import { ROLE_SITES, percent, sampleAt, type RoleSite } from './data';
import { RoleHead, ValidityBadge } from './parts';

interface Row {
  label: string;
  unit: string;
  value: (site: RoleSite) => number;
  text: (site: RoleSite) => string;
  /** Which end is better for a lander; `none` rows are context, not a ranking. */
  better: 'high' | 'low' | 'none';
  validity: (site: RoleSite) => string;
}

const ROWS: readonly Row[] = [
  {
    label: 'Highest Sun elevation',
    unit: '°',
    value: (s) => s.metrics.max_sun_elevation_deg,
    text: (s) => s.metrics.max_sun_elevation_deg.toFixed(2),
    better: 'none',
    validity: (s) => s.validity.events,
  },
  {
    label: 'Sunlit share',
    unit: '',
    value: (s) => s.metrics.sunlit_fraction,
    text: (s) => percent(s.metrics.sunlit_fraction),
    better: 'high',
    validity: (s) => s.validity.events,
  },
  {
    label: 'Longest dark period',
    unit: 'h',
    value: (s) => s.metrics.longest_dark_hours,
    text: (s) => s.metrics.longest_dark_hours.toFixed(1),
    better: 'low',
    validity: (s) => s.validity.events,
  },
  {
    label: 'Earth in view',
    unit: '',
    value: (s) => s.metrics.earth_visible_fraction,
    text: (s) => percent(s.metrics.earth_visible_fraction),
    better: 'high',
    validity: (s) => s.validity.events,
  },
  {
    label: 'Longest Earth-hidden period',
    unit: 'h',
    value: (s) => s.metrics.longest_earth_hidden_hours,
    text: (s) => s.metrics.longest_earth_hidden_hours.toFixed(1),
    better: 'low',
    validity: (s) => s.validity.events,
  },
  {
    label: 'Direct link to a ground station',
    unit: '',
    value: (s) => s.link_share.direct ?? 0,
    text: (s) => percent(s.link_share.direct ?? 0),
    better: 'high',
    validity: (s) => s.validity.link,
  },
  {
    label: 'Mean panel power',
    unit: 'W',
    value: (s) => s.power.mean_power_w,
    text: (s) => s.power.mean_power_w.toFixed(1),
    better: 'high',
    validity: (s) => s.validity.power,
  },
  {
    label: 'Energy over the period',
    unit: 'kWh',
    value: (s) => s.power.energy_kwh,
    text: (s) => s.power.energy_kwh.toFixed(1),
    better: 'high',
    validity: (s) => s.validity.power,
  },
];

function bestId(row: Row, sites: readonly RoleSite[]): string | null {
  if (row.better === 'none' || sites.length < 2) return null;
  const sorted = [...sites].sort((a, b) => (row.better === 'high' ? row.value(b) - row.value(a) : row.value(a) - row.value(b)));
  const first = sorted[0];
  const second = sorted[1];
  if (!first || !second || row.value(first) === row.value(second)) return null;
  return first.id;
}

const CW = 720;
const CH = 230;
const PAD = 34;
const EL_MIN = -90;
const EL_MAX = 90;

/** Chart height of an elevation; the axis spans the whole range, so no sample is flattened. */
export function chartY(elevation: number): number {
  const clamped = Math.max(EL_MIN, Math.min(EL_MAX, elevation));
  return CH - PAD - ((clamped - EL_MIN) / (EL_MAX - EL_MIN)) * (CH - 2 * PAD);
}

function elevationPath(site: RoleSite): string {
  const n = site.samples.length;
  let path = '';
  for (let i = 0; i < n; i += 1) {
    const x = PAD + (i / Math.max(1, n - 1)) * (CW - 2 * PAD);
    path += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${chartY(sampleAt(site, i).sunElevation).toFixed(1)} `;
  }
  return path.trim();
}

export function EngineerPage() {
  const [chosen, setChosen] = useState<string[]>(ROLE_SITES.map((s) => s.id));
  const sites = ROLE_SITES.filter((s) => chosen.includes(s.id));
  const first = ROLE_SITES[0];
  const toggle = (id: string) =>
    setChosen((list) => (list.includes(id) ? (list.length > 1 ? list.filter((x) => x !== id) : list) : [...list, id]));

  return (
    <>
      <RoleHead
        role="engineer"
        title="Three sites, one month, side by side"
        lead="Compare light, power and contact, and see which input each number rests on."
        cta="Open the live workspace"
      />
      <section className="rp-panel rp-controls" aria-label="Scenario">
        <div className="rp-chips" role="group" aria-label="Sites in the comparison">
          {ROLE_SITES.map((s, i) => (
            <button key={s.id} type="button" className={`rp-chip rp-series-${i}`} aria-pressed={chosen.includes(s.id)} onClick={() => toggle(s.id)}>
              <strong>{s.name}</strong>
              <span>
                {Math.abs(s.lat_deg).toFixed(2)}° {s.lat_deg < 0 ? 'S' : 'N'}, {Math.abs(s.lon_deg).toFixed(2)}° {s.lon_deg < 0 ? 'W' : 'E'}
              </span>
            </button>
          ))}
        </div>
        <dl className="rp-fixed">
          <div>
            <dt>Period</dt>
            <dd>1 to 31 December 2026</dd>
          </div>
          <div>
            <dt>Mast height</dt>
            <dd>{first?.mast_height_m ?? 2} m</dd>
          </div>
          <div>
            <dt>Panel</dt>
            <dd>Vertical, tracking</dd>
          </div>
          <div>
            <dt>Earth criterion</dt>
            <dd>Disk centre</dd>
          </div>
        </dl>
      </section>

      <section className="rp-panel" aria-label="Comparison">
        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th scope="col">Measure</th>
                {sites.map((s) => (
                  <th key={s.id} scope="col">
                    {s.name}
                    <span className="rp-th-sub">{s.horizon === 'terrain' ? 'terrain horizon' : 'flat horizon'}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const best = bestId(row, sites);
                return (
                  <tr key={row.label}>
                    <th scope="row">
                      {row.label}
                      {row.unit ? <span className="rp-unit"> ({row.unit})</span> : null}
                    </th>
                    {sites.map((s) => (
                      <td key={s.id} className={best === s.id ? 'rp-best' : undefined}>
                        <span className="rp-num">{row.text(s)}</span>
                        <ValidityBadge value={row.validity(s)} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="rp-fine">Outlined cells are the better value of a row. The table ranks nothing overall and certifies no landing.</p>
      </section>

      <div className="rp-split">
        <section className="rp-panel" aria-label="Sun elevation over the month">
          <h2>Sun elevation over the month</h2>
          <svg viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Sun elevation in degrees for each chosen site across December 2026">
            <line className="rp-svg-axis" x1={PAD} x2={CW - PAD} y1={chartY(0)} y2={chartY(0)} />
            {[-90, -45, 0, 45, 90].map((v) => (
              <text key={v} className="rp-svg-compass" x={PAD - 8} y={chartY(v) + 4} textAnchor="end">
                {v}°
              </text>
            ))}
            {ROLE_SITES.map((s, i) => (chosen.includes(s.id) ? <path key={s.id} className={`rp-svg-line rp-series-${i}`} d={elevationPath(s)} /> : null))}
            <text className="rp-svg-compass" x={PAD} y={CH - 8}>
              1 Dec
            </text>
            <text className="rp-svg-compass" x={CW - PAD} y={CH - 8} textAnchor="end">
              31 Dec
            </text>
          </svg>
        </section>
        <section className="rp-panel" aria-label="Sources and assumptions">
          <h2>Sources and assumptions</h2>
          <ul className="rp-sources">
            <li>Positions: NASA NAIF SPICE, DE440, Moon-fixed frame MOON_ME, light-time and aberration corrected.</li>
            <li>
              Horizon: LOLA height map at Mons Mouton <ValidityBadge value="DERIVED" />; flat sphere elsewhere <ValidityBadge value="SYNTHETIC" />.
            </li>
            <li>
              Panel power uses a generic panel profile <ValidityBadge value="SYNTHETIC" />, not a spacecraft design.
            </li>
            <li>Ground stations: three Deep Space Network sites, 10° minimum elevation, an assumption. Relay satellites are not modelled.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
