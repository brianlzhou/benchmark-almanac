// The Almanac Index for the /index/ page script: every version's boards, the changelog, and the names and marks
// the page draws (src/components/almanac-index/payload.ts).
import { indexPayload } from '../../components/almanac-index/payload.ts';

export function GET() {
  return new Response(JSON.stringify(indexPayload()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
