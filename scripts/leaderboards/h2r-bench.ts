// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// H2R-Bench tests whether generated robot videos reproduce a human demonstration.
// The project leaderboard reports H2RCore (0 to 100) and five component scores for each target embodiment.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://rongdingyi.github.io/H2R-Bench/';
const embodiments = ['Parallel-Jaw Gripper', 'Dexterous Hand'];
const measures = ['Goal completion', 'Action completion', 'Contact transfer', 'Embodiment correctness', 'Video quality', 'H2RCore'];
const parts = Object.fromEntries(embodiments.flatMap((group, i) =>
  measures.map((name, j) => [`e${i}m${j}`, { name: group + ': ' + name, group }])));

const board: Leaderboard = {
  benchmark: 'h2r-bench', url: feed, feed, parts,
  terms: 'The authors publish this page under CC BY-SA 4.0 at https://creativecommons.org/licenses/by-sa/4.0/.',
  headline: 'The leaderboard gives no overall score, so this is the plain mean of gripper and hand H2RCore.',
  aliases: { 'Seedance 2.0': 'dreamina-seedance-2-0', 'HunyuanVideo 1.5-I2V': 'hunyuan-video-1-5' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === ['Model', ...embodiments].join('|'));
    const header = 'M1|M2|M3|M4|M5|H2RCore';
    if (!table || table[1].map(c => c.text).join('|') !== header + '|' + header) throw new Error('H2R-Bench results header changed');
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const cells of table.slice(2)) {
      if (cells[0]?.attrs.scope === 'rowgroup') {
        setting = cells[0].text;
        continue;
      }
      if (!setting || cells.length !== 13) throw new Error('H2R-Bench results row changed');
      const model = cells[0].text.replace(/ best$/, '');
      const values = cells.slice(1).map(c => numberCell(c.text));
      rows.push({ model, setting, score: (values[5] + values[11]) / 2,
        metrics: Object.fromEntries(Object.keys(parts).map((key, i) => [key, values[i]])) });
    }
    return checked(rows, 11);
  },
};
export default board;
