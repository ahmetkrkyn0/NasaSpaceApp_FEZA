import { useState } from 'react';
import { getEvents, getPanelProfiles, getPower } from '../../api/client';
import { formatDate, formatDeg, formatHours, formatNumber, formatPercent } from '../../api/format';
import type { PowerSample, PowerSeries, Scenario } from '../../api/types';
import { useAsync, useStore } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { eventsRequest, locationWithMast, powerRequest, scenarioDays } from '../../state/scenario-tools';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { PANEL_TYPE_LABEL } from '../setup/form';
import { AsyncBlock, ExampleNote, Field, Fields, HorizonNote, NeedsScenario, PanelHeader, ScenarioPeriod, useHorizon, useRequest } from '../setup/shared';

/**
 * Power tab (UC-06): Sun elevation, sunlit time, longest dark, power curve and mean power.
 * Panel values are assumptions, so every power figure carries the "Assumed" label. There is no
 * battery or night-survival estimate: both are out of scope (docs/product/use-cases-and-scenarios.md, UC-06).
 */

function PowerCurve({ samples }: { samples: readonly PowerSample[] }) {
  if (samples.length < 2) {
    return <p className="d-muted">No hourly power samples in this answer.</p>;
  }
  const max = Math.max(...samples.map((s) => s.power_w));
  const width = 300;
  const height = 100;
  const points = samples
    .map((s, i) => {
      const x = (i / (samples.length - 1)) * width;
      const y = max > 0 ? height - (s.power_w / max) * height : height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  return (
    <figure className="d-section" aria-label="Panel power over time">
      <svg className="d-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Power from ${formatDate(first.utc)} to ${formatDate(last.utc)}, highest hourly sample ${max.toFixed(1)} W`}>
        <line className="d-chart-axis" x1="0" y1={height} x2={width} y2={height} />
        <polyline className="d-chart-line" points={points} />
      </svg>
      <figcaption className="d-chart-caption">
        <span>{formatDate(first.utc)}</span>
        <span>highest hourly sample {max.toFixed(1)} W</span>
        <span>{formatDate(last.utc)}</span>
      </figcaption>
    </figure>
  );
}

function DirectionControl({ scenario, used }: { scenario: Scenario; used: number | null }) {
  const [text, setText] = useState(scenario.fixed_azimuth_deg != null ? String(scenario.fixed_azimuth_deg) : '');
  const value = text.trim() === '' ? null : Number(text);
  const invalid = value !== null && (!Number.isFinite(value) || value < 0 || value >= 360);
  const apply = () => {
    if (invalid) return;
    const next: Scenario = { ...scenario, fixed_azimuth_deg: value };
    scenarioStore.setScenario(next);
  };
  return (
    <div className="d-section">
      <h3 className="d-section-title">Panel direction</h3>
      <div className="d-row">
        <label className="d-control">
          <span className="d-control-label">Direction (°, from north)</span>
          <input className="d-input" inputMode="decimal" value={text} placeholder="Best direction" onChange={(e) => setText(e.target.value)} aria-invalid={invalid} />
        </label>
        <button type="button" className="d-button" disabled={invalid} onClick={apply}>
          Set direction
        </button>
      </div>
      {invalid ? <span className="d-error">Direction must be between 0 and 360 degrees.</span> : null}
      <p className="d-muted">
        {used === null ? 'The server did not report the direction it used.' : `Direction used: ${formatDeg(used, 1)}`}
        {scenario.fixed_azimuth_deg == null ? ' (best direction picked by the server)' : ''}
      </p>
    </div>
  );
}

export function PowerResults({ scenario, power }: { scenario: Scenario; power: PowerSeries }) {
  const { summary } = power;
  const periodHours = scenarioDays(scenario) * 24;
  const sunlitHours = summary.sunlit_fraction === null ? null : summary.sunlit_fraction * periodHours;
  const badge = <ValidityBadge validity={power.validity} note="assumed panel values" />;
  return (
    <>
      <Fields>
        <Field label="Mean panel power" value={formatNumber(summary.mean_power_w, 'W')} badge={badge} />
        <Field label="Energy" value={formatNumber(summary.energy_kwh, 'kWh')} badge={badge} />
        <Field
          label="Sunlit time"
          value={summary.sunlit_fraction === null ? formatPercent(null) : `${formatPercent(summary.sunlit_fraction)} (${formatHours(sunlitHours)})`}
          badge={badge}
        />
        <Field label="Longest dark" value={formatHours(summary.longest_dark_hours)} badge={badge} />
      </Fields>
      <PowerCurve samples={power.samples} />
    </>
  );
}

export default function PowerPanel() {
  const scenario = useStore(scenarioStore, (s) => s.active);
  if (!scenario) {
    return (
      <section className="d-panel" aria-label="Power">
        <PanelHeader title="Power" />
        <NeedsScenario />
      </section>
    );
  }
  return <PowerForScenario scenario={scenario} />;
}

function PowerForScenario({ scenario }: { scenario: Scenario }) {
  const location = locationWithMast(scenario);
  const profiles = useAsync((signal) => getPanelProfiles({ signal }), []);
  const power = useRequest(getPower, powerRequest(scenario));
  const events = useRequest(getEvents, eventsRequest(scenario));
  const horizon = useHorizon(location, scenario.mast_height_m);
  const profile = profiles.state.data?.find((p) => p.id === scenario.panel_profile_id) ?? null;

  return (
    <section className="d-panel" aria-label="Power">
      <PanelHeader title="Power" />
      <ExampleNote />
      <ScenarioPeriod label={scenario.label} start_utc={scenario.start_utc} end_utc={scenario.end_utc} />
      {horizon.state.data ? <HorizonNote horizon={horizon.state.data} /> : null}

      <div className="d-section">
        <h3 className="d-section-title">Sun</h3>
        <AsyncBlock result={events}>
          {(data) => (
            <Fields>
              <Field
                label="Highest Sun"
                value={formatDeg(data.metrics.max_sun_elevation_deg)}
                badge={<ValidityBadge validity={data.validity} />}
              />
            </Fields>
          )}
        </AsyncBlock>
      </div>

      <div className="d-section">
        <h3 className="d-section-title">Panel</h3>
        {profile ? (
          <Fields>
            <Field
              label="Type"
              value={`${PANEL_TYPE_LABEL[profile.type]}, ${profile.area_m2} m², efficiency ${profile.efficiency}`}
              badge={<ValidityBadge validity={profile.validity} note="default values" />}
            />
          </Fields>
        ) : null}
        <AsyncBlock result={power}>
          {(data) => (
            <>
              <PowerResults scenario={scenario} power={data} />
              {profile?.type === 'vertical_fixed' ? <DirectionControl key={scenario.scenario_id} scenario={scenario} used={data.fixed_azimuth_deg} /> : null}
            </>
          )}
        </AsyncBlock>
      </div>
    </section>
  );
}
