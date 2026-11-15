import type { ReactNode } from 'react';
import { ART, Feature, Illustration } from './parts';
import { roleHref, type Role } from './route';

interface Card {
  role: Role;
  title: string;
  tagline: string;
  text: string;
  cta: string;
  art: ReactNode;
  features: ReactNode;
}

/** Sun and Earth over a horizon line: the product's own picture, drawn from the palette. */
function HorizonArt() {
  return (
    <svg className="rp-card-svg" viewBox="0 0 240 150" role="img" aria-label="Sun and Earth above a lunar horizon">
      <path className="rp-svg-track" d="M12 104 C 70 28, 170 28, 228 104" />
      <circle className="rp-svg-sun" cx="78" cy="58" r="15" />
      <circle className="rp-svg-earth" cx="170" cy="52" r="11" />
      <path className="rp-svg-ground" d="M0 112 L36 104 L70 110 L112 98 L150 108 L196 100 L240 108 L240 150 L0 150 Z" />
      <path className="rp-svg-tick" d="M120 116 v10 M60 118 v6 M180 118 v6" />
    </svg>
  );
}

const CARDS: readonly Card[] = [
  {
    role: 'public',
    title: 'Public',
    tagline: 'Discover the Moon',
    text: 'See where the Sun and Earth stand above the horizon at a landing site, in one simple picture.',
    cta: 'Start exploring',
    art: <Illustration src={ART.earthMoon} label="Illustration, not to scale" className="rp-art-card" />,
    features: (
      <>
        <Feature icon="cube">3D views</Feature>
        <Feature icon="book">Plain-language facts</Feature>
        <Feature icon="clock">Simple time control</Feature>
      </>
    ),
  },
  {
    role: 'educator',
    title: 'Educator',
    tagline: 'Turn curiosity into understanding',
    text: 'Guide learners through the same science with a question, three steps and a quick check.',
    cta: 'Open classroom',
    art: <HorizonArt />,
    features: (
      <>
        <Feature icon="cap">Guided tasks</Feature>
        <Feature icon="steps">Step-by-step activity</Feature>
        <Feature icon="picture">Visual explanations</Feature>
      </>
    ),
  },
  {
    role: 'engineer',
    title: 'Engineer',
    tagline: 'Inspect. Compare. Explain.',
    text: 'Put sites and dates side by side, with every number labelled by where it comes from.',
    cta: 'Open workspace',
    art: <Illustration src={ART.surface} label="Illustration" className="rp-art-card rp-art-lander" />,
    features: (
      <>
        <Feature icon="sliders">Scenario controls</Feature>
        <Feature icon="compare">Compare and explain</Feature>
        <Feature icon="sources">Sources and assumptions</Feature>
      </>
    ),
  },
];

export function StartPage() {
  return (
    <>
      <div className="rp-hero">
        <h1>One Moon. Three ways to explore.</h1>
        <p className="rp-lead">Choose your perspective. The same computed numbers, at three levels of detail.</p>
      </div>
      <ul className="rp-cards">
        {CARDS.map((card) => (
          <li key={card.role} className={`rp-card rp-card-${card.role}`}>
            <h2>{card.title}</h2>
            <p className="rp-tagline">{card.tagline}</p>
            <div className="rp-card-art">{card.art}</div>
            <p className="rp-card-text">{card.text}</p>
            <ul className="rp-features">{card.features}</ul>
            <a className={`rp-btn ${card.role === 'educator' ? 'rp-btn-solid' : 'rp-btn-line'}`} href={roleHref(card.role)}>
              {card.cta}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
