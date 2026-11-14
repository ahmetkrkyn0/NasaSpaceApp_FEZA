import type { RelayStatus } from '../../api/types';
import './relay.css';

/**
 * "Relay required" label (docs/design/role-etiketi.md). The server decides the status from the
 * share of time Earth is in view over the period; this only names it. The label shows when the
 * answer carries `relay_status` and stays hidden otherwise (PLAN F3-D1, dependencies).
 */

export const RELAY_LABEL: Record<RelayStatus, string> = {
  required: 'Relay required',
  intermittent: 'Relay needed part of the time',
  not_required: 'Direct to Earth',
  unknown: 'Relay need unknown',
};

export const RELAY_TEXT: Record<RelayStatus, string> = {
  required:
    'Earth never rises above the horizon at this site in the selected period. Direct-to-Earth communication is not possible; a relay satellite is needed.',
  intermittent: 'Earth is below the horizon for part of the period. Direct contact is possible only in the windows listed below.',
  not_required: 'Earth stays above the horizon for the whole period, so direct contact is possible throughout.',
  unknown:
    'Earth did not rise in this period, but the period is shorter than a month, so it cannot show whether Earth stays hidden. Choose a longer period.',
};

/** Example card for a site that needs a relay (docs/design/role-etiketi.md, section 6). */
export const RELAY_EXAMPLE = {
  text: "Example: Chang'e 4 talks to Earth through the relay satellite Queqiao, which circles a balance point beyond the Moon about 65,000 km away and sees both Earth and the far side.",
  source: { label: 'CNSA, 3 January 2019', file: 'docs/research/dogrulama/aciklanabilirlik.md', row: '60' },
};

export function RelayLabel({ status }: { status: RelayStatus | undefined }) {
  if (!status) return null;
  const strong = status === 'required';
  return (
    <div className={strong ? 'd-note d-note-warn' : 'd-note'} role="note" aria-label="Relay">
      <p>
        <span className={`d-relay d-relay-${status}`}>{RELAY_LABEL[status]}</span> {RELAY_TEXT[status]}
      </p>
      {strong ? (
        <p className="d-muted">
          {RELAY_EXAMPLE.text} ({RELAY_EXAMPLE.source.label})
        </p>
      ) : null}
    </div>
  );
}
