// DeceptionBench measures attack success and deceptive behavior in language models.
// Table 1 reports DeceptionBench attack success rate, where lower is better, beside safety metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2505.18807';
const board: Leaderboard = {
  benchmark: 'deceptionbench-pku-alignment', static: 'paper',
  url: 'https://arxiv.org/abs/2505.18807', feed: FEED,
  terms: 'The authors publish the paper under the arXiv terms of use. https://arxiv.org/abs/2505.18807',
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find((t) => t[0]?.[1] === 'DeceptionBench' && t[1]?.[2] === '( ASR ↓)');
    if (!table) throw new Error('DeceptionBench Table 1 missing');
    let base = '';
    const rows = table.slice(2).map((row) => {
      if (/^(Llama-3\.1-8B-Instruct|Llama-3\.1-8B-R1-Distll|Qwen2\.5-7B-Instruct|Qwen2\.5-7B-R1-Distll)$/.test(row[0])) base = row[0];
      const model = /^(Base w CoT|Safe SFT|Safe SFT w CoT|Safe CoT SFT|w STAR-1|w SafeChain|Self-Monitor)/.test(row[0]) ? `${base} ${row[0]}` : row[0];
      return { model, score: Number(row[2]), metrics: { dtr: row[1] === '-' ? 0 : Number(row[1]), strongRejectPAP_A: Number(row[3]), strongRejectPAP_M: Number(row[4]), strongRejectPAP_L: Number(row[5]), strongRejectPAIR: Number(row[6]), beaverTailsHelpful: Number(row[7]), beaverTailsHarmless: Number(row[8]) } };
    });
    return checked(rows, 10);
  },
};
export default board;
