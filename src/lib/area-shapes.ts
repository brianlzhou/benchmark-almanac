// Each area's mark on a 10 by 10 grid: its color in its own shape, so an area reads by shape as well as by color.
// circle, triangle, square, diamond, hexagon, star, plus. Other is a small ring. AreaMark.astro draws these on
// the server, and pages that draw in the browser use areaSvg.
export const AREA_SHAPES: Record<string, string> = {
  knowledge: '<circle cx="5" cy="5" r="4.6"/>',
  reasoning: '<path d="M5 .6 9.6 9H.4z"/>',
  code: '<rect x=".8" y=".8" width="8.4" height="8.4" rx="1.2"/>',
  agents: '<path d="M5 .2 9.8 5 5 9.8.2 5z"/>',
  work: '<path d="M5 .4 9 2.7v4.6L5 9.6 1 7.3V2.7z"/>',
  multimodal: '<path d="M5 .3l1.4 3 3.3.4-2.4 2.3.6 3.3L5 7.7 2.1 9.3l.6-3.3L.3 3.7l3.3-.4z"/>',
  safety: '<path d="M3.4.6h3.2v2.8h2.8v3.2H6.6v2.8H3.4V6.6H.6V3.4h2.8z"/>',
  other: '<circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
};

/** An area's mark as an SVG string, in the area's color. */
export function areaSvg(area: string, size = 10, cls = 'amark'): string {
  const id = AREA_SHAPES[area] ? area : 'other';
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 10 10" aria-hidden="true" style="color:var(--area-${id})">${AREA_SHAPES[id]}</svg>`;
}
