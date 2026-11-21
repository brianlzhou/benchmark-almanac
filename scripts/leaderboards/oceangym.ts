// The source reports no overall score. The headline is the plain mean of the 12 parts, computed by this importer.
// OceanGym tests simulated underwater navigation. The project site's decision table reports eight shallow-water
// and four deep-water task scores, with a spread beside each value.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://oceangpt.github.io/OceanGym/';
const board: Leaderboard = {
  benchmark: 'oceangym', url: feed, feed, parts: {},
  terms: 'The OceanGym authors publish aggregate results at https://oceangpt.github.io/OceanGym/.',
  headline: 'The site reports separate environment averages, so the headline is the plain mean of its 12 decision tasks.',
  async fetch() {
    const page = await fetchText(feed);
    const path = page.match(/<script[^>]+src="([^"]*\/js\/app\.[\w-]+\.js)"/)?.[1];
    if (!path) throw new Error('Missing OceanGym app bundle');
    const bundle = await fetchText(new URL(path, feed).href);
    const table = tables(bundle).find(t => t[0]?.[0]?.text === 'Task' && t[0]?.at(-1)?.text === 'Human');
    if (!table) throw new Error('Missing decision table');
    const rows = table[0].slice(1,-1).map(c => ({model: c.text, score: 0, metrics: {} as Record<string,number>}));
    let group = '', count = 0;
    for (const [first, ...values] of table.slice(1)) {
      if (!values.length) {
        group = first.text;
        continue;
      }
      if (!group || rows.length + 1 !== values.length) throw new Error('Unexpected decision columns');
      const avg = first.text === 'Average';
      const key = (group.split(' ')[0] + first.text).replace(/[^A-Za-z0-9]/g, '');
      board.parts![key] = {name: first.text, group};
      for (const [j,row] of rows.entries()) {
        const m = values[j].text.match(/^([\d.]+)\s*±\s*([\d.]+)$/);
        if (!m || key in row.metrics) throw new Error('Missing or repeated OceanGym task');
        const value = Number(m[1]);
        row.metrics[key] = value;
        row.metrics[key + 'Spread'] = Number(m[2]);
        if (!avg) row.score += value;
      }
      if (!avg) count++;
    }
    if (count !== 12) throw new Error('Expected 12 decision tasks');
    for (const row of rows) row.score /= count;
    return checked(rows, 4);
  },
};
export default board;
