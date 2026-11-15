/**
 * Surface image of the 3D Moon: the colour map of NASA SVS 4720 "CGI Moon Kit" (2019 version,
 * `lroc_color_poles_4k.tif`, 4096 x 2048, equirectangular, centred on 0° longitude), saved as JPEG.
 * Source and licence are in `frontend/public/media/CREDITS.md`.
 */
export const MOON_TEXTURE_URL = `${import.meta.env.BASE_URL}media/moon/lroc-color-poles-4k.jpg`;

/**
 * Turn of the globe mesh about its vertical axis so that the texture lines up with
 * `latLonToVector`. three.js `SphereGeometry` puts the image's left edge (-180°) at -X, which in
 * this module's frame is -90°; turning by -90° puts every image longitude at the same globe
 * longitude. Checked against the geometry's own UVs in `globe.test.tsx`.
 */
export const TEXTURE_ROTATION_Y = -Math.PI / 2;

export const SURFACE_IMAGE_NOTE =
  'Surface image: NASA SVS CGI Moon Kit (LRO camera colour; near the poles, laser-altimeter brightness). It is processed for appearance, shown for orientation only and not used in any calculation.';
