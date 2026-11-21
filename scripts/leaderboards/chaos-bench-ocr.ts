// CHAOS-Bench tests faithful transcription of altered words. Table 11 in the HunyuanOCR-1.5 report
// gives the page-average recall as a percentage under the benchmark authors’ evaluation protocol.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2607.04884';
const board: Leaderboard = {
  benchmark: 'chaos-bench-ocr', static: 'paper', url: 'https://arxiv.org/abs/2607.04884', feed, terms: PAPER_TERMS,
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const t = tables.find(t => t[0]?.join('|') === 'Model|Size|Page-avg Recall\\uparrow');
    if (!t || t.length < 7) throw new Error('Missing CHAOS-Bench results');
    return t.slice(1).map(([model,size,value]) => {
      const match = size.match(/^([\d.]+)B(?:-A([\d.]+)B)?$/);
      if (!match) throw new Error('Unknown CHAOS-Bench model size '+size);
      return {model,score:numberCell(value),params:numberCell(match[1]),...(match[2] ? {metrics:{activeParamsB:numberCell(match[2])}} : {})};
    });
  },
};
export default board;
