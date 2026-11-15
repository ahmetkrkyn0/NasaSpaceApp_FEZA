/**
 * three.js helpers shared by the 3D Moon (#105) and the space scene (#123). Imported only from
 * the lazily loaded views, so three.js stays out of the first bundle.
 */

import { useEffect, useState } from 'react';
import * as THREE from 'three';

/** CSS token value from the page, so the scene follows the dark and light themes. */
export function token(name: string, fallback: string): THREE.Color {
  const value = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

/** Current theme (`<html data-theme>`), so a theme switch rebuilds the scene with its colours. */
export function useThemeKey(): string {
  const read = () => (typeof document === 'undefined' ? '' : document.documentElement.getAttribute('data-theme') ?? 'dark');
  const [key, setKey] = useState(read);
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => setKey(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return key;
}

export interface CachedTexture {
  /** The texture once loaded, else `null`. */
  current(): THREE.Texture | null;
  /** Loads once per page; a failed load can be tried again. */
  load(): Promise<THREE.Texture>;
}

/** A colour image loaded once per page and reused when a scene is rebuilt. */
export function cachedTexture(url: string): CachedTexture {
  let texture: THREE.Texture | null = null;
  let pending: Promise<THREE.Texture> | null = null;
  return {
    current: () => texture,
    load() {
      pending ??= new THREE.TextureLoader().loadAsync(url).then(
        (loaded) => {
          loaded.colorSpace = THREE.SRGBColorSpace;
          texture = loaded;
          return loaded;
        },
        (error: unknown) => {
          pending = null;
          throw error;
        },
      );
      return pending;
    },
  };
}

/**
 * Shows a cached texture on a material: at once when it is loaded, otherwise when it arrives
 * (if the scene still exists). The material keeps its plain colour if the image cannot load.
 */
export function showTexture(
  source: CachedTexture,
  material: THREE.MeshStandardMaterial,
  renderer: THREE.WebGLRenderer,
  alive: () => boolean,
  render: () => void,
): void {
  const apply = (texture: THREE.Texture) => {
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    material.map = texture;
    material.color.set('white');
    material.needsUpdate = true;
  };
  const ready = source.current();
  if (ready) {
    apply(ready);
    return;
  }
  source.load().then(
    (texture) => {
      if (!alive()) return;
      apply(texture);
      render();
    },
    () => undefined,
  );
}
