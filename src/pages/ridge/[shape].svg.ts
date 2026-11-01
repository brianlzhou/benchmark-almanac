// The footer ridge's outlines (one per area) and its stipple tile, built once as static files. Every page's
// footer uses them as CSS masks from cache, instead of carrying the outlines in its own HTML. See src/lib/ridge.ts.
import { ridgePaths, dotTile, LAYERS, W, H } from '../../lib/ridge.ts';

export function getStaticPaths() {
  return [...LAYERS, 'dots'].map((shape) => ({ params: { shape } }));
}

export function GET({ params }: { params: { shape: string } }) {
  const svg =
    params.shape === 'dots'
      ? dotTile(40, 11)
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${ridgePaths().get(params.shape)}"/></svg>`;
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml' } });
}
