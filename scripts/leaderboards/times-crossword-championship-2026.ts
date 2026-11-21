// The Times Championship compares perfect grids across seven cryptic crosswords.
// Table 6 of the paper gives the live system and six standalone models. The 65k run covers only three puzzles.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const feed = 'https://arxiv.org/html/2611.13557v1';
const board: Leaderboard = {
  benchmark: 'times-crossword-championship-2026', static: 'paper',
  url: feed + '#S5.T6', feed,
  terms: 'arXiv permits HTML retrieval with a 15-second crawl delay. The authors list the arXiv distribution license and give no license for the grids.',
  stats: { cluesSolved: { name: 'Clues solved', unit: 'count', better: 'higher' }, clues: { name: 'Clues', unit: 'count' }, wrong: { name: 'Wrong answers', unit: 'count', better: 'lower' }, blank: { name: 'Blank answers', unit: 'count', better: 'lower' }, latency: { name: 'Median time', unit: 'seconds', better: 'lower' }, fastestSeconds: { name: 'Fastest time', unit: 'seconds', better: 'lower' }, slowestSeconds: { name: 'Slowest time', unit: 'seconds', better: 'lower' } },
  parts: { hard65k: { name: '65k, Hard 9', note: 'Nine draws on SF1, SF3, and Final under a 65k token cap.' } },
  async fetch() {
    const html = await paperHtml(feed);
    const table = inlinePaperTables(html.split('<figure id="S5.T6"')[1].split('</figure>')[0])[0];
    if (table[0].slice(2, 6).join('|') !== 'Perfect Grids|Clues Solved|Wrong / Blank|Med Time (Range)' || table.length < 9)
      throw new Error('Missing Times Championship columns or results');
    const runs = table.slice(1).map(([label, date, grids, clues, wrongBlank, time]) => {
      const name = label.match(/^(.+?) \((.+)\)$/);
      const percent = grids.match(/\(([\d.]+)\\%\)/);
      const counts = [clues, wrongBlank].map(value => value.match(/^(\d+)\/(\d+)$/));
      const times = [...time.matchAll(/(\d+)\{:\}(\d+)/g)].map(m => 60 * Number(m[1]) + Number(m[2]));
      if (!name || !percent || !counts[0] || !counts[1] || times.length !== 3) throw new Error('Invalid crossword result: ' + label);
      const metrics: Record<string, number> = { cluesSolved: +counts[0][1], clues: +counts[0][2], wrong: +counts[1][1],
        blank: +counts[1][2], latency: times[0], fastestSeconds: times[1], slowestSeconds: times[2] };
      return { model: name[1], setting: name[2], score: +percent[1], metrics, trials: name[2] === 'Live Contest' ? 1 : 3,
        date: name[2] === 'Live Contest' ? date : undefined };
    });
    const hard = runs.find(r => r.setting === '65k, Hard 9');
    const full = runs.find(r => r.model === hard?.model && r.setting === '32k Cap');
    if (!hard || !full) throw new Error('Missing Argon configuration');
    full.metrics.hard65k = hard.score;
    return runs.filter(r => r !== hard);
  },
};
export default board;
