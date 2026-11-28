// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table V tests object retrieval in eight indoor scenes with object-room and object-room-floor queries.
// The trial counts in this table are averages per scene.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2403.17846';
const board: Leaderboard = {
  benchmark: 'hm3dsem-walks', url: 'https://hovsg.github.io/', feed, static: 'paper',
  terms: 'The authors publish Table V at https://arxiv.org/abs/2403.17846.',
  parts: { room: 'Object and room', floor: 'Object, room and floor' },
  stats: {
    floorNavigation: { name: 'Object, room and floor navigation success rate', unit: '%', better: 'higher' },
    roomNavigation: { name: 'Object and room navigation success rate', unit: '%', better: 'higher' },
  },
  headline: 'The paper gives no overall retrieval success rate, so this is the plain mean across its two query types.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Query Type|Method|# Trials|Retrieval-SR 10 [%]|Navigation-SR [%]');
    if (!table) throw new Error('Missing Table V');
    const models = new Set(table.slice(1).map(r => r[1]));
    return checked([...models].map(label => {
      const cells = table.slice(1).filter(r => r[1] === label);
      const metrics: Record<string, number> = {};
      for (const [key, query] of [['floor', '( o , r , f )'], ['room', '( o , r )']]) {
        const row = cells.find(r => r[0] === query);
        if (!row || row.length !== 5) throw new Error('Missing query type for ' + label);
        metrics[key] = numberCell(row[3]);
        if (row[4] !== '-') metrics[key + 'Navigation'] = numberCell(row[4]);
      }
      return { model: label.replace(' (ours)', ''), metrics, score: (metrics.floor + metrics.room) / 2 };
    }), 2);
  },
};
export default board;
