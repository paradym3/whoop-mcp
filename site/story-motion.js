/**
 * @param {number} start
 * @param {number} end
 * @param {number} progress
 * @returns {number}
 */
export function captionOpacity(start, end, progress) {
  const fade = 0.015;
  const amount = Math.max(0, Math.min(1, (progress - start) / fade, (end - progress) / fade));
  return amount * amount * (3 - 2 * amount);
}

/**
 * @param {number} viewportHeight
 * @param {number} captionTop
 * @param {number} worldHeight
 * @returns {{scale: number, y: number}}
 */
export function fitBandAboveCaption(viewportHeight, captionTop, worldHeight) {
  const top = 44;
  const available = Math.max(0, captionTop - top - 24);
  const worldPerPixel = worldHeight / viewportHeight;
  return {
    // The rotating model and its shadow fit inside a 3.2-unit vertical envelope.
    scale: Math.min(0.66, (available * worldPerPixel) / 3.2),
    y: (viewportHeight / 2 - top - available / 2) * worldPerPixel,
  };
}
