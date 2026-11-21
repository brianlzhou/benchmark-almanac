// Z.ai's verified Terminal-Bench 2.0 review measures whole-benchmark task success.
// The importer reads the three-model evaluation table in the dataset README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://huggingface.co/datasets/zai-org/terminal-bench-2-verified/raw/main/README.md';
const board: Leaderboard = {
  benchmark: 'terminal-bench-2-0-verified-zai',
  url: 'https://huggingface.co/datasets/zai-org/terminal-bench-2-verified',
  feed: FEED,
  terms: 'Results are published in the Z.ai dataset README under its Apache 2.0 license.',
  aliases: {},
  async fetch() {
    const text = await fetchText(FEED);
    const start = text.indexOf('| Version | Claude Sonnet 4.5 | Claude Opus 4.5 | GLM-5 |');
    if (start < 0) throw new Error('verified evaluation table missing');
    const end = text.indexOf('\n\n', start);
    const table = text.slice(start, end < 0 ? text.length : end);
    const out: LeaderboardRow[] = [];
    for (const line of table.split('\n').slice(2)) {
      if (line.includes('**Official Benchmark')) break;
      const cells = line.split('|').map(x => x.trim());
      if (cells.length < 5 || !cells[1]) continue;
      const version = cells[1];
      for (const [model, cell] of [['Claude Sonnet 4.5', cells[2]], ['Claude Opus 4.5', cells[3]], ['GLM-5', cells[4]]] as const) {
        const score = parseFloat(cell.replace(/\*/g, ''));
        if (Number.isFinite(score)) out.push({ model, setting: version, score });
      }
    }
    return checked(out, 8);
  },
};
export default board;
