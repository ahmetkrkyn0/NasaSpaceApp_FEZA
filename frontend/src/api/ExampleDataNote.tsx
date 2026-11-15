import { exampleSource } from './recorded';

/** Keep the original example's identity beside values when it substitutes for a request. */
export function ExampleDataNote({ value, fallbackOnly = false }: { value: unknown; fallbackOnly?: boolean }) {
  const source = exampleSource(value);
  if (!source || (fallbackOnly && source.matched)) return null;
  const time = (utc: string) => utc.replace('T', ' ').replace('Z', ' UTC');
  const period = source.period_label ?? (source.start_utc === source.end_utc
    ? time(source.start_utc) : `${time(source.start_utc)} to ${time(source.end_utc)}`);
  return (
    <p className="d-note d-note-example" role="note">
      Example data: {source.label}, {period}.
      {source.matched ? ` Recorded ${source.recorded_utc}.` : ' This example does not match the selected site, period or settings. Choose a research scenario or use live data for this selection.'}
    </p>
  );
}
