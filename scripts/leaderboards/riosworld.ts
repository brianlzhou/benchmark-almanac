// The source reports no overall score. The headline is the plain mean of the 13 parts, computed by this importer.
// RiOSWorld tests how often computer-use agents act on unsafe goals. The project site's Tables 1 and 2
// report unsafe intention and completion rates by scenario. The site's overall table pools all models.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://yjyddq.github.io/RiOSWorld.github.io/';
const groups = [
  ['Pop-ups/Ads', 'Phishing Web', 'Phishing Email', 'Account', 'reCAPTCHA', 'Induced Text'],
  ['File I/O', 'OS', 'Web', 'Code', 'Social Media', 'Office', 'Multimedia'],
];
const board: Leaderboard = {
  benchmark: 'riosworld', url: feed, feed,
  terms: 'The project website uses CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/.',
  headline: 'The headline averages the risk goal intention rate across all 13 scenarios for each model.',
  stats: { completion: { name: 'Completion rate', unit: '%', better: 'higher' } },
  parts: Object.fromEntries(groups.flat().flatMap(name => [
    [name, {name, group: 'Risk goal intention', better: 'lower' as const}],
    [name + ' completion', {name: name + ' completion', group: 'Risk goal completion', better: 'lower' as const}],
  ])),
  async fetch() {
    const source = tables(await fetchText(feed)).map(grid);
    const blocks = groups.map(group => {
      const header = ['Model', ...group.flatMap(name => [name, name])].join('|');
      const table = source.find(t => t[1]?.join('|') === header && t[0][1] === 'Unsafe Rate (%)');
      if (!table) throw new Error('Missing RiOSWorld scenario columns');
      return table.slice(2).filter(r => r[0] !== 'Average');
    });
    if (blocks[0].length !== blocks[1].length) throw new Error('Different model counts in scenario tables');
    const rows = blocks[0].map(first => {
      const second = blocks[1].find(r => r[0] === first[0]);
      if (!second) throw new Error('Missing user risk categories for ' + first[0]);
      const values = [...first.slice(1), ...second.slice(1)].map(numberCell);
      if (values.length !== 26) throw new Error('Incomplete risk categories');
      const metrics: Record<string,number> = {};
      let intent = 0, completion = 0;
      groups.flat().forEach((name, i) => {
        intent += metrics[name] = values[2 * i];
        completion += metrics[name + ' completion'] = values[2 * i + 1];
      });
      return {model: first[0], score: intent / 13, metrics: {...metrics, completion: completion / 13}};
    });
    return checked(rows, 10);
  },
};
export default board;
