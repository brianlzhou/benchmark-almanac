// Linguini tests linguistic reasoning with unfamiliar languages. Tables 1 and 2 give exact-match
// accuracy by number of in-context examples and without context. Table 8 gives chrF.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2409.12126';
const board: Leaderboard = {
  benchmark: 'linguini', static: 'paper', url: 'https://arxiv.org/abs/2409.12126', feed, terms: PAPER_TERMS,
  aliases: { 'qwen-1.5-110b-it':'qwen1-5-110b', 'gpt-4':'gpt-4-turbo-jan-2024','gpt-4o':'gpt-4o-may-2024','gpt-4-turbo':'gpt-4-turbo-apr-2024','llama-3-70b-it':'llama-3-70b','llama-2-70b-it':'llama-2-70b','mistral-0.1-8x7b':'mixtral-8x7b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const main = tables.find(t => t[0]?.length === 8 && t[0][7].startsWith('Best('));
    const noContext = tables.find(t => t[0]?.[2] === 'No context');
    const chrf = tables.find(t => t[0]?.join('|') === 'Model|0|1|2|3|4|5');
    const specs = tables.find(t => t[0]?.[1] === 'API Version');
    if (!main || !noContext || !chrf || !specs || main[0].slice(1,7).join('|') !== '0|1|2|3|4|5') throw new Error('Missing Linguini tables');
    const rows: LeaderboardRow[] = [];
    for (const [model,...scores] of main.slice(1)) {
      const c = chrf.find(r => r[0] === model), n = noContext.find(r => r[0] === model), spec = specs.find(r => r[0] === model);
      if (!c || !n || !spec || scores.length !== 7) throw new Error('Missing Linguini configuration');
      const info = {model, open:spec[4] === '✓', params:spec[3] === '-' ? undefined : numberCell(spec[3])};
      const variant = model.startsWith('llama-') ? model.endsWith('-it') ? ', instruction tuned' : ', base' : '';
      for (let i=0;i<6;i++) rows.push({...info,setting:i+' in-context examples'+variant,score:numberCell(scores[i]),metrics:{chrF:numberCell(c[i+1])}});
      rows.push({...info,setting:'No context'+variant,score:numberCell(n[2])});
    }
    if (rows.length < 91) throw new Error('Missing Linguini results');
    return rows;
  },
};
export default board;
