// The Reporting page's data: every release from launch posts and the documents published with them, with the
// benchmarks each names. The page fetches it when a reader changes a filter. See src/lib/reporting.ts.
import { reportingData } from '../lib/reporting.ts';

export function GET() {
  return new Response(JSON.stringify(reportingData()), { headers: { 'Content-Type': 'application/json' } });
}
