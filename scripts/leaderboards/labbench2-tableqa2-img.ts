// LABBench2 TableQA2 (image) asks models to answer research questions about tables supplied as images.
// The score is the leaderboard's average score, converted from a fraction to a percentage.
// This importer reads the JSON rows embedded in the Edison Advances leaderboard page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://advances.edisonscientific.com/benchmarks/labbench2/tableqa2-img/';

interface Entry { model?: string; variant?: string | null; primary_score?: number; average_output_tokens?: number; average_duration?: number; timestamp?: string }
function readRows(source: string): LeaderboardRow[] {
  const match = source.match(/const clientRows = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('LABBench2 TableQA2 image: embedded rows missing');
  const entries = JSON.parse(match[1]) as Entry[];
  if (entries.length !== 10) throw new Error(`LABBench2 TableQA2 image: ${entries.length} rows, expected 10`);
  return entries.map((entry) => {
    if (!entry.model || typeof entry.primary_score !== 'number' || !entry.timestamp) throw new Error('LABBench2 TableQA2 image: incomplete row');
    return { model: entry.model, score: entry.primary_score * 100, setting: entry.variant ?? undefined, date: entry.timestamp.slice(0, 10), tokens: entry.average_output_tokens, metrics: { latency: entry.average_duration! } };
  });
}

const board: Leaderboard = {
  benchmark: 'labbench2-tableqa2-img',
  url: PAGE,
  feed: `${PAGE} (embedded clientRows leaderboard data)`,
  terms: 'Edison publishes these scores on the benchmark page without a separate score reuse license. Results are credited to Edison Scientific.',
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  fetch: async () => readRows(await fetchText(PAGE)),
};

export default board;
