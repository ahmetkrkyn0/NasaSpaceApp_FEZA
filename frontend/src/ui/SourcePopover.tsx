import { useEffect, useId, useRef, useState } from 'react';
import { VALIDITY_DESCRIPTION, ValidityBadge, type Validity } from './ValidityBadge';

export interface SourceReference {
  /** Human-readable source name, e.g. "NASA PGDA product 69". */
  label: string;
  url?: string;
}

export interface SourcePopoverProps {
  validity: Validity;
  sources: readonly SourceReference[];
  /** Optional qualifier passed to the badge, e.g. "terrain not included". */
  note?: string;
}

/**
 * Validity badge that opens a small panel listing where a value comes from.
 * Closes on Escape, on a click outside, or on the toggle.
 */
export function SourcePopover({ validity, sources, note }: SourcePopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <span className="source-popover" ref={rootRef}>
      <button
        type="button"
        className="source-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <ValidityBadge validity={validity} note={note} />
        <span className="source-toggle-text">Source</span>
      </button>
      <span id={panelId} className="source-panel" role="dialog" aria-label="Data source" hidden={!open}>
        <span className="source-panel-text">{VALIDITY_DESCRIPTION[validity]}</span>
        {sources.length === 0 ? (
          <span className="source-panel-text">No source listed.</span>
        ) : (
          <ul className="source-list">
            {sources.map((source) => (
              <li key={source.label}>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer noopener">
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
              </li>
            ))}
          </ul>
        )}
      </span>
    </span>
  );
}
