// ExtremeDrive tests trajectory planning and execution. Table III ranks five planners by S+,
// the reported upper bound on the 0 to 100 composite score. ES is the success rate on critical clips.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.20574';
const board: Leaderboard = {
  benchmark:'extremedrive', static:'paper', url:feed, feed, terms:PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline:'S+ is the published upper bound on the composite planning score, on a scale from 0 to 100.',
  parts:{ collision:{name:'Collision',unit:'%',better:'lower'},road:'Road compliance',ttc:'Time-to-collision compliance',progress:'Progress',comfort:'Noncritical comfort',critical:'Critical success rate' },
  stats:{
    adeMeters:{name:'Average displacement error',unit:'score',better:'lower',note:'Measured in meters.'},
    fdeMeters:{name:'Final displacement error',unit:'score',better:'lower',note:'Measured in meters.'},
  },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t=>t[0].join('|')==='Method|Input|ADE/FDE (m)\\downarrow|S^{+}\\uparrow|Collision\\downarrow|Road\\uparrow|TTC\\uparrow|Progress\\uparrow|C\\uparrow|ES\\uparrow');
    if (!table) throw Error('Missing planning and execution results');
    return checked(table.slice(1).map(([model, input, displacement, ...cells]) => {
      const distances = displacement.split('/').map(numberCell);
      if (distances.length !== 2 || cells.length !== 7 || !['V','V+L'].includes(input)) throw Error('Invalid planning results row');
      const [score, collision, road, ttc, progress, comfort, critical] = cells.map(numberCell);
      return { model, score, setting:input==='V' ? 'Camera' : 'Camera and LiDAR',
        metrics:{ adeMeters:distances[0], fdeMeters:distances[1], collision, road, ttc, progress, comfort, critical } };
    }),5);
  },
};
export default board;
