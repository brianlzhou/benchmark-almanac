// The Progress page's picker list: every benchmark with a record line, most-scored first (src/lib/progress-data.ts).
import { progressIndex } from '../../lib/progress-data.ts';

export function GET() {
  return new Response(JSON.stringify(progressIndex()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
