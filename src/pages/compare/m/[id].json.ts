// One model's scores for the Compare page: its best number on each benchmark from independent runs and from its
// lab, and whether its own posts report the test (src/lib/compare-data.ts). The page fetches the picked models only.
import type { APIRoute } from 'astro';
import { compareFile, compareIds } from '../../../lib/compare-data.ts';

export function getStaticPaths() {
  return compareIds().map((id) => ({ params: { id } }));
}

export const GET: APIRoute = ({ params }) => {
  const f = compareFile(params.id!);
  if (!f) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(f), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
