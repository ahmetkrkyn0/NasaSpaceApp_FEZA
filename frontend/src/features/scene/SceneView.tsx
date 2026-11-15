import { useState } from 'react';
import { ILLUSTRATION_NOTE, LANDER_NOTE, mediaUrl, type SceneChoice } from './media';
import './scene.css';

/** `poster` and `loop` are added to the scene's three still views. */
type ViewId = 'poster' | 'loop' | string;

export interface SceneViewProps {
  choice: SceneChoice;
  /**
   * Initial view; the panel starts on the poster and never plays the loop by itself. A new site
   * mounts a new instance (see `ScenePanelView`), so it also starts on the poster.
   */
  initialView?: ViewId;
}

function sourceLink(url: string, label: string) {
  if (/^https?:\/\//.test(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }
  return <span>{label}</span>;
}

/**
 * Surface view: an illustration of the site's terrain type. It is not data, so it carries an
 * "Illustration" label instead of a validity badge, and the notes saying what is not computed
 * are always on screen while an image is shown.
 */
export function SceneView({ choice, initialView = 'poster' }: SceneViewProps) {
  const [view, setView] = useState<ViewId>(initialView);

  if (choice.kind !== 'scene') {
    const text =
      choice.kind === 'none'
        ? 'Pick a site to see an illustration of its terrain type.'
        : choice.kind === 'custom'
          ? 'Custom points have no surface illustration: the terrain type of a point is not known.'
          : `No surface illustration for this site. ${choice.reason}`;
    return (
      <section className="scene-panel" aria-label="Surface view">
        <h2 className="panel-kicker">Surface view</h2>
        <p className="scene-note">{text}</p>
      </section>
    );
  }

  const { scene, site } = choice;
  const buttons: { id: ViewId; label: string }[] = [
    { id: 'poster', label: 'Scene' },
    ...scene.views.map((v) => ({ id: v.id, label: v.label })),
    { id: 'loop', label: 'Orbit loop' },
  ];
  const still = view === 'poster' ? scene.poster : scene.views.find((v) => v.id === view)?.file ?? scene.poster;
  const alt = `Illustration of ${scene.title.toLowerCase()} terrain (${buttons.find((b) => b.id === view)?.label ?? 'Scene'}); not the real surface of this site.`;

  return (
    <section className="scene-panel has-figure" aria-label="Surface view">
      {/*
        The tag and both notes form one block that stays on screen (sticky) while any part of the
        panel is in view, so the image is never seen without them.
      */}
      <div className="scene-lead">
        <div className="scene-head">
          <h2 className="panel-kicker">Surface view</h2>
          <span className="scene-tag">Illustration</span>
        </div>
        <p className="scene-note scene-note-strong">{ILLUSTRATION_NOTE}</p>
        <p className="scene-note scene-lander">{LANDER_NOTE}</p>
      </div>
      <figure className="scene-figure">
        {view === 'loop' ? (
          <video
            className="scene-media"
            src={mediaUrl(scene.loop)}
            poster={mediaUrl(scene.poster)}
            muted
            loop
            playsInline
            preload="none"
            autoPlay
            controls
            aria-label={alt}
          />
        ) : (
          <img className="scene-media" src={mediaUrl(still)} alt={alt} loading="lazy" />
        )}
      </figure>
      <div className="scene-views" role="group" aria-label="Illustration view">
        {buttons.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`scene-view${b.id === view ? ' is-active' : ''}`}
            aria-pressed={b.id === view}
            onClick={() => setView(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>
      <p className="scene-type">
        <span className="scene-type-name">{scene.title}</span> · {scene.description}
      </p>
      <p className="scene-note scene-basis">
        Terrain type: {site.basis} Source: {sourceLink(site.source_url, site.source_label)}
      </p>
    </section>
  );
}
