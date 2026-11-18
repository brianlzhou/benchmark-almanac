// One benchmark's scores for the time machine's watch column: every score its page's leading source holds on a
// tracked model, with the day each became known, so the page can rank the board on any day. Fetched when a reader
// picks the benchmark, so the time machine's own payload carries none of it.
import { watchable, watchFile } from '../../../lib/time-machine.ts';

export function getStaticPaths() {
  return [...watchable().keys()].map((id) => ({ params: { id } }));
}

export function GET({ params }: { params: { id: string } }) {
  const file = watchFile(params.id);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(file), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
