// Table 1 distinguishes pass@1, pass@3 and pass@5.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2503.01619';
const board: Leaderboard = {
  benchmark: 'flame-react-eval', static: 'paper', url: URL, feed: URL + ' (Table 1 pass@1)', terms: PAPER_TERMS,
  aliases: {"LLaVA-Qwen2-72B-OV": "llava-onevision-72b", "LLaVA-Qwen2-7B-OV": "llava-onevision-7b"},
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.join('|') === 'Model|pass@1|pass@3|pass@5');
    if (!t || t.length < 4) throw new Error('Flame React results missing');
    return t.slice(1).map(r => ({model: paperModel(r[0]), score: parseFloat(r[1]), setting: 'pass@1', metrics: {passAt3: parseFloat(r[2]), passAt5: parseFloat(r[3])}}));
  },
};
export default board;
