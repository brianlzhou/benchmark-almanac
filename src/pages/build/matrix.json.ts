// The index builder's score matrix (src/lib/build-data.ts): every benchmark with enough scored models, and the
// best score per model from independent runs and from the labs' own posts. The /build/ page loads it.
import { buildPayload } from '../../lib/build-data.ts';

export function GET() {
  return new Response(JSON.stringify(buildPayload()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
