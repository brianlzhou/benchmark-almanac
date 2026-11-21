// Pipecat's Speech-to-Text Benchmark runs 24 services on the same 1,000 realtime clips.
// The headline score is pooled semantic word error rate, where lower is better.
// This importer reads the benchmark page's server-rendered results table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.pipecat.ai/benchmarks/speech-to-text';

function cellText(cell: string): string {
  return cell
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function number(value: string): number {
  const parsed = Number(value.replace(/[% ,]/g, ''));
  if (!Number.isFinite(parsed)) throw new Error(`Pipecat STT: invalid number ${value}`);
  return parsed;
}

const board: Leaderboard = {
  benchmark: 'pipecat-stt-benchmark',
  url: PAGE,
  feed: `${PAGE} (the server-rendered results table)`,
  terms: 'The benchmark repository uses BSD-2-Clause and its dataset uses CC BY 4.0. Results are credited to Pipecat.',
  headline: 'Pooled semantic word error rate from 1,000 realtime clips',
  stats: { transcripts: { name: 'Transcripts', unit: 'count' }, perfect: { name: 'Perfect transcripts', unit: 'count', better: 'higher' }, werMean: { name: 'Mean word error rate', unit: '%', better: 'lower' }, ttfsP50: { name: 'Time to first speech P50', unit: 'ms', better: 'lower' }, ttfsP95: { name: 'Time to first speech P95', unit: 'ms', better: 'lower' }, ttfsP99: { name: 'Time to first speech P99', unit: 'ms', better: 'lower' } },
  fetch: async () => {
    const html = await fetchText(PAGE);
    const table = html.match(/<table[^>]*>[\s\S]*?<thead>[\s\S]*?<\/thead>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/i)?.[1];
    if (!table) throw new Error('Pipecat STT: results table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => cellText(m[1]));
      if (!cells.length) continue;
      if (cells.length !== 8) throw new Error(`Pipecat STT: expected 8 cells, got ${cells.length}`);
      const model = cells[0].replace(/^\d+\s*/, '').replace(/\s*◆$/, '').trim();
      if (!model) throw new Error('Pipecat STT: empty model name');
      rows.push({
        model,
        score: number(cells[4]),
        metrics: {
          transcripts: number(cells[1]),
          perfect: number(cells[2]),
          werMean: number(cells[3]),
          ttfsP50: number(cells[5]),
          ttfsP95: number(cells[6]),
          ttfsP99: number(cells[7]),
        },
      });
    }
    if (rows.length !== 24) throw new Error(`Pipecat STT: found ${rows.length} rows, expected 24`);
    return rows;
  },
};

export default board;
