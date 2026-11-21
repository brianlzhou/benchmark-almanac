// Massive Visualized IR Benchmark evaluates screenshot retrieval across four task groups.
// The headline score is the published overall score, with each task-group score kept as a part metric.
// This importer reads the leaderboard's CSV from the Hugging Face Space.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/spaces/BAAI/MVRB_leaderboard';
const FEED = 'https://huggingface.co/spaces/BAAI/MVRB_leaderboard/raw/main/results.csv';
const strip = (value: string) => value.replace(/<[^>]+>/g, '').trim();

const board: Leaderboard = {
  benchmark: 'massive-visualized-ir-benchmark',
  url: PAGE,
  feed: FEED,
  terms: 'The leaderboard page does not state separate score reuse terms. Results are credited to BAAI.',
  parts: { sr: { name: 'SR', group: 'Task group' }, csr: { name: 'CSR', group: 'Task group' }, sqa: { name: 'SQA', group: 'Task group' }, ovc: { name: 'OVC', group: 'Task group' } },
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    if (rows.length !== 11) throw new Error(`Massive Visualized IR Benchmark: ${rows.length} rows, expected 11`);
    return rows.map((row) => {
      const score = Number(row.Overall);
      if (!row.Model || !Number.isFinite(score)) throw new Error('Massive Visualized IR Benchmark: incomplete row');
      const metrics: Record<string, number> = {};
      for (const [key, column] of [['sr', 'SR'], ['csr', 'CSR'], ['sqa', 'SQA'], ['ovc', 'OVC']] as const) {
        const value = Number(row[column]);
        if (Number.isFinite(value)) metrics[key] = value;
      }
      const params = Number(row['#Params (B)']);
      return { model: strip(row.Model), score, ...(Number.isFinite(params) ? { params } : {}), metrics };
    });
  },
};

export default board;
