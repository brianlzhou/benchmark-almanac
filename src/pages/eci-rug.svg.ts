// The strip behind every model card's index score: one tick per model on the Epoch Capabilities Index.
// Built once as a static file, so each card shows it from cache instead of drawing hundreds of ticks.
import { eciValues } from '../lib/data.ts';

export function GET() {
  const lo = eciValues[0] ?? 0;
  const hi = eciValues.at(-1) ?? 1;
  const ticks = eciValues.map((v) => `M${(((v - lo) / (hi - lo)) * 999.5 + 0.25).toFixed(1)} 0v8`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 8" preserveAspectRatio="none"><path d="${ticks}" stroke="#a1a1aa" stroke-opacity=".6" stroke-width="1" vector-effect="non-scaling-stroke" fill="none"/></svg>`;
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml' } });
}
