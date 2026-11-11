// The Compare page's model picker: every model with a file under /compare/m/, highest ECI first, with its lab,
// release date and how many benchmarks it has a score on (src/lib/compare-data.ts).
import { compareIndex } from '../../lib/compare-data.ts';

export function GET() {
  return new Response(JSON.stringify(compareIndex()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
