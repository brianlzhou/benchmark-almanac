// The source reports no overall score. The headline is the plain mean of the 9 parts, computed by this importer.
// VSI-SUPER tests spatial recall (VSR accuracy) and continual counting (VSC mean relative accuracy).
// Tables 7 and 17 report both tasks by duration. Table 17 tests three strategies on the same LFP checkpoint.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2511.04670';
const durations = [10, 30, 60, 120, 240, 10, 30, 60, 120];
const keys = durations.map((n, i) => (i < 5 ? 'vsr' : 'vsc') + n);
const board: Leaderboard = {
  benchmark: 'vsi-super', static: 'paper', feed, url: feed,
  terms: 'The authors publish the paper on arXiv. https://info.arxiv.org/help/license/index.html',
  headline: 'The paper reports no overall score, so this is the plain mean of five spatial recall and four continual counting scores.',
  parts: Object.fromEntries(keys.map((key, i) => [key, { name: (i < 5 ? 'VSR' : 'VSC') + ': ' + durations[i] + ' minutes',
    group: i < 5 ? 'Spatial recall accuracy' : 'Continual counting mean relative accuracy' }])),
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const id of ['S3.T7', 'A6.T17']) {
      const figure = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      const table = figure?.split(/<span\b[^>]*class="ltx_tr"[^>]*>/).slice(1).map(row =>
        row.split(/<span\b[^>]*class="ltx_td\b[^"]*"[^>]*>/).slice(1).map(text));
      if (!table || !table[0][1]?.startsWith('VSR') || !table[0][2]?.startsWith('VSC') ||
          !durations.every((n, i) => parseInt(table[1][i + 1]) === n)) throw new Error('Missing duration columns in ' + id);
      for (const [label, ...cells] of table.slice(2)) {
        if (cells.length !== keys.length || !cells.every(c => /^\d+\.\d+$/.test(c))) throw new Error('Invalid duration scores for ' + label);
        const values = cells.map(Number);
        const metrics = Object.fromEntries(keys.map((k, i) => [k, values[i]]));
        const score = values.reduce((sum, v) => sum + v, 0) / keys.length;
        rows.push(id === 'S3.T7' ? { model: 'Cambrian-S-7B', score, metrics, setting: label } :
          { model: 'Cambrian-S-7B-LFP', score, metrics, harness: label === 'Ours' ? 'Surprise-driven memory and agentic counting' : label });
      }
    }
    return checked(rows, 5);
  },
};
export default board;
