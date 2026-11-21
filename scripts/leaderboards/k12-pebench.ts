// K12-PEBench tests how accurately models identify errors in intermediate reasoning steps.
// Table 9 gives overall accuracy across step labels and accuracy for each label.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.01676';
const columns = [{"key":"Overall","name":"Overall","index":1,"scale":1},{"key":"CS","name":"CS","index":2,"scale":1},{"key":"ICE","name":"ICE","index":3,"scale":1},{"key":"QM","name":"QM","index":4,"scale":1},{"key":"LRK","name":"LRK","index":5,"scale":1},{"key":"KAE","name":"KAE","index":6,"scale":1},{"key":"LRE","name":"LRE","index":7,"scale":1},{"key":"HE","name":"HE","index":8,"scale":1},{"key":"CE","name":"CE","index":9,"scale":1},{"key":"IAE","name":"IAE","index":10,"scale":1}] as const;
const board: Leaderboard = {
  benchmark: 'k12-pebench', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { "InternVL2.5-MPO-78B":"internvl2-5-78b-mpo", "InternVL2.5-MPO-8B":"internvl2-5-8b-mpo" },
  parts: Object.fromEntries(columns.map(column => [column.key, column.name])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid)
      .find(t => JSON.stringify(t[0]) === "[\"Model\",\"Overall\",\"CS\",\"ICE\",\"QM\",\"LRK\",\"KAE\",\"LRE\",\"HE\",\"CE\",\"IAE\"]");
    if (!table) throw Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      const metrics: Record<string, number> = {};
      for (const { key, index, scale } of columns) {
        const value = cells[index]?.trim().replace(/%$/, '');
        if (!value || !Number.isFinite(Number(value))) throw Error('Invalid ' + key + ' for ' + model);
        metrics[key] = Number(value) * scale;
      }
      rows.push({ model, score: metrics.Overall, metrics });
    }
    return checked(rows, 9);
  },
};
export default board;
