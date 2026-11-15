import { useState } from 'react';
import content from '../../content/ground-stations.json';
import './stations.css';

/**
 * "Who listens on Earth" (issue #81): a folding section of the Earth link panel with three
 * Deep Space Network complexes. The pictures are illustrations rendered with Unity, and every
 * fact in the text comes from NASA's Deep Space Network page. The product computes Earth
 * visibility from the landing site for Earth's disk, not for a particular station, and the
 * section says so.
 */

export interface GroundStation {
  id: string;
  name: string;
  place: string;
  text: string;
  /** Path under `frontend/public/media/`. */
  image: string;
  alt: string;
  source_url: string;
}

export const GROUND_STATIONS = content.stations as GroundStation[];
export const STATIONS_CONTENT = content;

/** Address of a file in `frontend/public/media/`, under the app's base path. */
export function mediaUrl(path: string): string {
  return `${import.meta.env.BASE_URL}media/${path}`;
}

function SourceLink({ url, label }: { url: string; label: string }) {
  return (
    <a className="d-link" href={url} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

/** Shown only while the section is open, so the pictures are never fetched while it is closed. */
export function StationsBody() {
  return (
    <div className="d-stations">
      <p className="d-stations-label">
        <span className="d-illustration">Illustration</span> {content.illustration_note}
      </p>
      <p className="d-note" role="note">
        {content.no_station_note}
      </p>
      <figure className="d-stations-globe">
        <img src={mediaUrl(content.globe.image)} alt={content.globe.alt} loading="lazy" decoding="async" />
      </figure>
      <p>
        {content.intro} {content.moon_note}{' '}
        <span className="d-muted">
          (Source: <SourceLink url={content.source.url} label={content.source.label} />)
        </span>
      </p>
      <ul className="d-stations-list" aria-label="Deep Space Network complexes">
        {GROUND_STATIONS.map((s) => (
          <li key={s.id} className="d-card d-station">
            <img src={mediaUrl(s.image)} alt={s.alt} loading="lazy" decoding="async" />
            <p className="d-card-title">
              {s.name} <span className="d-muted">{s.place}</span>
            </p>
            <p>
              {s.text}{' '}
              <span className="d-muted">
                (<SourceLink url={s.source_url} label="NASA" />)
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GroundStations({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details className="d-section d-details" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="d-section-title">Who listens on Earth</summary>
      {open ? <StationsBody /> : null}
    </details>
  );
}
