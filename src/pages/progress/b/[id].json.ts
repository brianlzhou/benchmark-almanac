// One benchmark's record steps for the Progress page, from each source its page can show (src/lib/progress-data.ts).
// Fetched when a reader adds the benchmark, so the page itself carries only the ones it opens on.
import { progressIds, progressFile } from '../../../lib/progress-data.ts';

export function getStaticPaths() {
  return progressIds().map((id) => ({ params: { id } }));
}

export function GET({ params }: { params: { id: string } }) {
  const file = progressFile(params.id);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(file), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
