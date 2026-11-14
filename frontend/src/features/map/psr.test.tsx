import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sitesExample } from '../../api/examples';
import { ApiError } from '../../api/errors';
import { syntheticLayer } from '../../api/layers';
import { layerMissing } from './index';
import { MapView, type MapViewProps } from './MapView';
import { PSR_NOTE } from './raster';

function render(overrides: Partial<MapViewProps>): string {
  const props: MapViewProps = {
    view: 'region',
    onView: () => undefined,
    sites: sitesExample,
    activeSiteId: null,
    point: null,
    layerName: 'hillshade',
    onLayerName: () => undefined,
    layer: { kind: 'none' },
    onPickPoint: () => undefined,
    onPickSite: () => undefined,
    ...overrides,
  };
  return renderToStaticMarkup(<MapView {...props} />);
}

describe('permanent shadow layer option', () => {
  it('is offered with the shadow-not-ice note when the layer exists', () => {
    const html = render({ psrAvailable: true });
    expect(html).toMatch(/<option value="psr" title="Shadow only, not ice\. Ice presence is uncertain\.">Permanent shadow<\/option>/);
  });

  it('is shown disabled when the server has no such layer', () => {
    const html = render({ psrAvailable: false });
    expect(html).toMatch(/<option value="psr" disabled="" title="Not available on this server\.[^"]*">Permanent shadow \(not available\)<\/option>/);
  });

  it('carries the note in the legend when picked', () => {
    const html = render({ layerName: 'psr', layer: { kind: 'ready', grid: syntheticLayer('psr') } });
    expect(html).toContain(`<span class="map-legend-note">${PSR_NOTE}</span>`);
    expect(render({ layerName: 'hillshade' })).not.toContain('map-legend-note');
  });

  it('treats only a 503 or data_unavailable answer as a missing layer', () => {
    expect(layerMissing(new ApiError('data_unavailable', 'no layer', 503))).toBe(true);
    expect(layerMissing(new ApiError('http_error', 'Service Unavailable', 503))).toBe(true);
    expect(layerMissing(new ApiError('data_unavailable', 'no layer', null))).toBe(true);
    expect(layerMissing(new ApiError('network_error', 'offline', null))).toBe(false);
    expect(layerMissing(new Error('boom'))).toBe(false);
  });
});
