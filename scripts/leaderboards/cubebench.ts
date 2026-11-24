// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// CubeBench agents solve cubes using four observation modalities at two horizons.
// The project site reports pass rates for basic and solver-assisted agents.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://cubebench.c7w.tech/';
const modes = ['Full Symbolic','Full Visual','Face View','Vertex View'];
const names = modes.flatMap(mode => ['Short','Long'].map(horizon => mode + ': ' + horizon));
const board: Leaderboard = {
  benchmark: 'cubebench', url, feed: url, parts: Object.fromEntries(names.map(n => [n,n])),
  aliases: {'InternVL-3 (78B)': 'internvl3-78b'},
  terms: 'Princeton AI Lab publishes the results at https://cubebench.c7w.tech/ under the project site terms.',
  headline: 'The headline is the plain mean of eight pass rates across four observation modalities and two horizons.',
  reference: ['Basic'], harnesses: 'system',
  async fetch() {
    const ts = tables(await fetchText(url)).map(grid);
    const rows: LeaderboardRow[] = [];
    for (const baseline of [true,false]) {
      const headers = ['Model', ...(baseline ? [] : ['Agent Type']), ...modes.flatMap(mode => [mode,mode])];
      const table = ts.find(t => t[0]?.join('|') === headers.join('|') && t[1]?.slice(-8).join('') === 'SLSLSLSL');
      if (!table) throw new Error('Missing CubeBench pass rates');
      for (const r of table.slice(2)) {
        const harness = baseline ? 'Basic' : r[1];
        if (!baseline && harness === 'Basic') continue;
        const cells = r.slice(baseline ? 1 : 2);
        if (cells.includes('--')) continue;
        if (cells.length !== 8 || cells.some(c => !/^(?:0|1)(?:\.\d+)?$/.test(c))) throw new Error('Unexpected pass rate');
        const values = cells.map(c => Number(c)*100);
        rows.push({model:r[0], harness, score: values.reduce((a,b) => a+b)/8,
          metrics:Object.fromEntries(names.map((n,i) => [n,values[i]]))});
      }
    }
    return checked(rows, 17);
  },
};
export default board;
