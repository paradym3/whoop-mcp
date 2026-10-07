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
