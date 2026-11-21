// JamendoLyrics tests word-onset alignment on 20 English songs.
// Table 1 gives mean absolute error in seconds. Section 5 reports the same
// measurements for a second Wave-U-Net trained on separated vocals.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/1902.06797';
export default {
  benchmark: 'jamendolyrics', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/1902.06797',
  parts: {perc: {name: 'Percentage of correct segments', unit: '%'}},
  async fetch() {
    const html = await paperHtml(feed);
    const table = paperTables(html).map(grid).find(t => t[0].includes('Jamendo') && t[1]?.[0] === 'Metric');
    if (!table) throw new Error('Missing word alignment table');
    const index = table[0].indexOf('Jamendo');
    if (table[1][index] !== 'Ours') throw new Error('Missing authors’ Jamendo results');
    const ae = Number(table.find(r => r[0] === 'AE')?.[index]);
    const perc = Number(table.find(r => r[0] === 'Perc')?.[index]);
    const prose = text(html.replace(/<math\b[^>]*alttext="([^"]*)"[^>]*>[\s\S]*?<\/math>/g, '$1'));
    const result = prose.match(/lower the AE from ([\d.]+) to ([\d.]+) \(Perc up from ([\d.]+)\s*% to ([\d.]+)\s*%\) on our Jamendo dataset/);
    if (!result || Number(result[1]) !== ae || Number(result[3]) !== perc) throw new Error('Missing vocal separation comparison');
    return checked([
      {model: 'Wave-U-Net', setting: 'Polyphonic mixtures', score: ae, metrics: {perc}},
      {model: 'Wave-U-Net', setting: 'Separated vocals', score: Number(result[2]), metrics: {perc: Number(result[4])}},
    ], 2);
  },
} satisfies Leaderboard;
