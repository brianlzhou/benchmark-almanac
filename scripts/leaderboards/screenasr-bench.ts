// ScreenASR-Bench measures Chinese speech recognition with and without visual context.
// Table 1 reports overall word error rate and target recall for audio-only, keyframe image and caption inputs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2610.16260';
const parts = ['ETE', 'EVE', 'ISE'];
const board: Leaderboard = {
  benchmark: 'screenasr-bench', url: feed, feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: Object.fromEntries(parts.flatMap(p => [[p, { name: p + ' WER', unit: '%' as const, better: 'lower' as const }],
    [p + ' recall', { name: p + ' recall', unit: '%' as const, better: 'higher' as const }]])),
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|Vision|ETE|ETE|EVE|EVE|ISE|ISE|Overall|Overall'
      && t[1]?.join('|') === 'Model|Vision|WER|Recall|WER|Recall|WER|Recall|WER|Recall');
    if (!table) throw Error('Missing ScreenASR-Bench Table 1');
    const rows: LeaderboardRow[] = [];
    let model = '';
    // Some multirow labels appear in the last row of the group in the HTML.
    for (const [label, vision, ...cells] of table.slice(2).reverse()) {
      if (label.endsWith('Models') && vision === label) { model = ''; continue; }
      model = label || model;
      if (!model || !['-', 'Image', 'Caption'].includes(vision) || cells.length !== 8
        || !cells.every(s => /^\d+(?:\.\d+)?$/.test(s))) throw Error('Invalid Table 1 result');
      const values = cells.map(Number);
      const metrics: Record<string, number> = { recall: values[7] };
      parts.forEach((p, i) => { metrics[p] = values[2*i]; metrics[p + ' recall'] = values[2*i+1]; });
      rows.push({ model, score: values[6], setting: vision === '-' ? 'Audio only' : 'Audio + ' + vision, metrics });
    }
    return checked(rows.reverse(), 26);
  },
};
export default board;
