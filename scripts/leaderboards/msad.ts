// MSAD tests video anomaly detection. The makers publish overall ROC AUC and average precision
// for two training sets, with breakdowns by anomaly type and recording scenario.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://msad-dataset.github.io/';
const anomalyTypes = ['Assault','Explosion','Fighting','Fire','ObjectFalling','PeopleFalling','Robbery','Shooting','TrafficAccident','Vandalism','WaterIncident'];
const scenarios = ['Frontdoor','Highway','Mall','Office','Park','Parkinglot','PedestrianSt','Restaurant','Road','Shop','Sidewalk','StreetHighview','Train','Warehouse'];
const breakdownStats = Object.fromEntries([...anomalyTypes, ...scenarios].map(name => [name + 'AP', {name: name + ' average precision', unit: '%', better: 'higher'}]));
const board: Leaderboard = {
  benchmark: 'msad', url: feed, feed, parts: Object.fromEntries([...anomalyTypes.map(name => [name, {name, group:'Anomaly type'}]), ...scenarios.map(name => [name, {name, group:'Scenario'}])]),
  terms: 'The makers publish the aggregate comparison tables at https://msad-dataset.github.io/.',
  stats: { averagePrecision: { name: 'Average precision', unit: '%', better: 'higher' }, ...breakdownStats },
  async fetch() {
    const results = tables(await fetchText(feed)).map(grid).filter(t => t[0]?.[0] === 'Training set');
    if (results.length !== 2) throw new Error('Missing MSAD breakdowns');
    const rows = new Map<string, LeaderboardRow>();
    for (const [i, table] of results.entries()) {
      let headings: string[] = [];
      for (const r of table) {
        if (r[0] === 'Training set') {
          if (r[2] === 'AUC') {
            if (!r.slice(2).every((c,j) => c === (j % 2 ? 'AP' : 'AUC'))) throw new Error('Changed MSAD metrics');
          } else headings = r;
          continue;
        }
        if (r.length !== headings.length) throw new Error('Unexpected MSAD columns');
        const id = JSON.stringify(r.slice(0,2));
        const row = rows.get(id) ?? {model: r[1], setting: 'Trained on ' + r[0], score: NaN, metrics: {}};
        for (let j = 2; j < r.length; j += 2) {
          const name = headings[j], auc = numberCell(r[j]), ap = numberCell(r[j+1]);
          if (name === 'Overall') {
            if (Number.isFinite(row.score) && row.score !== auc) throw new Error('Conflicting overall AUC');
            row.score = auc;
            row.metrics!.averagePrecision = ap;
          } else {
            const key = name.replace(/[^a-z0-9]/gi, '');
            board.parts![key] = {name, group: i === 0 ? 'Anomaly type' : 'Scenario'};
            row.metrics![key] = auc;
            row.metrics![key + 'AP'] = ap;
          }
        }
        rows.set(id, row);
      }
    }
    return checked([...rows.values()], 6);
  },
};
export default board;
