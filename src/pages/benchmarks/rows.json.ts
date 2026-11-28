// The /benchmarks/ table's rows after the first FIRST_ROWS, as batches of row HTML. The page's HTML holds only the
// first rows, so it stays small, and its script adds these a batch at a time (src/scripts/more-rows.ts). The same
// component renders both, so the rows are identical.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BenchmarkRows from '../../components/BenchmarkRows.astro';
import { rows, FIRST_ROWS } from '../../lib/benchmark-table.ts';

// one batch is a few milliseconds of parsing in the browser
const BATCH = 250;

export async function GET() {
  const container = await AstroContainer.create();
  const batches: string[] = [];
  for (let i = FIRST_ROWS; i < rows.length; i += BATCH)
    batches.push(await container.renderToString(BenchmarkRows, { props: { rows: rows.slice(i, i + BATCH), start: i } }));
  return new Response(JSON.stringify(batches), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
