/**
 * Reliability label carried by every computed or compiled structure
 * (docs/adr/0003-veri-sozlesmesi.md, rule 4).
 */
export type Validity = 'MEASURED' | 'MODEL' | 'DERIVED' | 'SYNTHETIC';

/** Lowest first, as in ADR-0003 and the reference interface. */
export const VALIDITY_ORDER: readonly Validity[] = ['SYNTHETIC', 'DERIVED', 'MODEL', 'MEASURED'];

/** Interface text for each value (docs/design/gosterim-ve-arayuz.md, "Güvenilirlik etiketi"). */
export const VALIDITY_LABEL: Record<Validity, string> = {
  MEASURED: 'Measured',
  MODEL: 'Model',
  DERIVED: 'Derived',
  SYNTHETIC: 'Assumed',
};

export const VALIDITY_DESCRIPTION: Record<Validity, string> = {
  MEASURED: 'Direct measurement or official record.',
  MODEL: 'Output of a physical model.',
  DERIVED: 'Computed from measured data.',
  SYNTHETIC: 'Assumption or placeholder value.',
};

/** A result built from several inputs takes the lowest label among them. */
export function lowestValidity(values: readonly Validity[]): Validity {
  if (values.length === 0) {
    throw new Error('lowestValidity needs at least one value.');
  }
  return values.reduce((low, value) =>
    VALIDITY_ORDER.indexOf(value) < VALIDITY_ORDER.indexOf(low) ? value : low,
  );
}

export interface ValidityBadgeProps {
  validity: Validity;
  /** Short qualifier shown after the label, e.g. "terrain not included". */
  note?: string;
}

/**
 * Small label shown next to a result. The text alone tells the four values
 * apart; the colour only repeats it.
 */
export function ValidityBadge({ validity, note }: ValidityBadgeProps) {
  const label = VALIDITY_LABEL[validity];
  return (
    <span
      className={`validity-badge validity-${validity.toLowerCase()}`}
      title={VALIDITY_DESCRIPTION[validity]}
    >
      <span className="validity-label">{label}</span>
      {note ? <span className="validity-note">{note}</span> : null}
    </span>
  );
}
