import type { CSSProperties, ReactNode } from 'react';
import { BrandMark } from '../shell/BrandMark';
import { ROLE_SITES, periodText } from './data';
import { ROLES, ROLE_LABEL, liveHref, roleHref, type Role, type RoleRoute } from './route';

const MEDIA = `${import.meta.env.BASE_URL}media/`;

/** Illustration files; sources and licences are in `frontend/public/media/CREDITS.md`. */
export const ART = {
  surface: `${MEDIA}scenes/moon-plains/lander.jpg`,
  terrain: `${MEDIA}scenes/moon-ridges/overview.jpg`,
  earthMoon: `${MEDIA}stations/earth-globe/overview.jpg`,
} as const;

export const RECORDED_NOTE =
  'Recorded example: answers recorded from the product’s own server. Not live.';

type IconName = 'cube' | 'book' | 'clock' | 'cap' | 'steps' | 'picture' | 'sliders' | 'compare' | 'sources';

const ICON_PATHS: Record<IconName, string> = {
  cube: 'M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v8m0 0 8-4m-8 4L4 7m8 4v10',
  book: 'M4 5c3-1 5-1 8 1 3-2 5-2 8-1v13c-3-1-5-1-8 1-3-2-5-2-8-1V5Zm8 1v13',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  cap: 'M2 9l10-5 10 5-10 5L2 9Zm4 2.5V16c2 2 10 2 12 0v-4.5M22 9v6',
  steps: 'M4 6l2 2 3-4M4 13l2 2 3-4M13 6h7M13 13h7M4 19h16',
  picture: 'M4 5h16v14H4V5Zm0 11 5-5 4 4 3-3 4 4M9 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  sliders: 'M4 7h9m4 0h3M4 12h3m4 0h9M4 17h11m4 0h1M15 5v4M9 10v4M17 15v4',
  compare: 'M4 5h9v9H4V5Zm7 5h9v9h-9v-9Z',
  sources: 'M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4',
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="rp-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function Feature({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <li className="rp-feature">
      <Icon name={icon} />
      <span>{children}</span>
    </li>
  );
}

export function ValidityBadge({ value }: { value: string }) {
  return <span className={`rp-badge rp-badge-${value.toLowerCase()}`}>{value}</span>;
}

/** An illustration with its label; the label is part of the picture, never optional. */
export function Illustration({ src, label, className = '' }: { src: string; label: string; className?: string }) {
  const style = { '--rp-art': `url(${src})` } as CSSProperties;
  return (
    <div className={`rp-art ${className}`} style={style} role="img" aria-label={label}>
      <span className="rp-art-label">{label}</span>
    </div>
  );
}

/** Page frame: backdrop, top bar with the role links, and the recorded-example note. */
export function Frame({ route, children }: { route: RoleRoute; children: ReactNode }) {
  const style = { '--rp-surface': `url(${ART.terrain})` } as CSSProperties;
  const first = ROLE_SITES[0];
  return (
    <div className={`rp-root rp-route-${route}`} style={style}>
      <div className="rp-backdrop" aria-hidden="true" />
      <header className="rp-top">
        <a className="rp-brand" href={roleHref('start')}>
          <BrandMark size={30} />
          <span>Lunar Navigator</span>
        </a>
        <nav className="rp-nav" aria-label="Roles">
          {ROLES.map((role) => (
            <a key={role} href={roleHref(role)} aria-current={route === role ? 'page' : undefined}>
              {ROLE_LABEL[role]}
            </a>
          ))}
        </nav>
      </header>
      <main className="rp-main">{children}</main>
      <footer className="rp-foot">
        <p>
          {route === 'start'
            ? 'You can switch your role at any time. One shared science model, three levels of detail.'
            : `${RECORDED_NOTE} Period: ${first ? periodText(first) : ''}, recorded from main ${first?.main_sha ?? ''}.`}
        </p>
        <p className="rp-foot-art">Background: illustration (Unreal Engine render), not the product’s calculation.</p>
      </footer>
    </div>
  );
}

/** Heading block of a role page with the link to the live console. */
export function RoleHead({ role, title, lead, cta }: { role: Role; title: string; lead: string; cta: string }) {
  return (
    <div className="rp-head">
      <div>
        <p className="rp-role">{ROLE_LABEL[role]}</p>
        <h1>{title}</h1>
        <p className="rp-lead">{lead}</p>
      </div>
      <a className="rp-btn rp-btn-solid" href={liveHref(role)}>
        {cta}
      </a>
    </div>
  );
}
