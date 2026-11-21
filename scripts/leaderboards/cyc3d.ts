// The source reports no overall score. The headline is the plain mean of the 7 parts, computed by this importer.
// Cyc3D tests how well models generate 3D assets from images. Table 2 scores each dimension from 0 to 100.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2608.28080';
const columns = [{"key":"structure","index":2,"scale":1,"name":"Geometric Structure"},{"key":"fidelity","index":3,"scale":1,"name":"Reference-View Fidelity"},{"key":"meshQuality","index":4,"scale":1,"name":"Mesh Quality"},{"key":"meshEfficiency","index":5,"scale":1,"name":"Mesh Efficiency"},{"key":"uv","index":6,"scale":1,"name":"UV Parameterization"},{"key":"consistency","index":7,"scale":1,"name":"Object Consistency"},{"key":"cycle","index":8,"scale":1,"name":"Cycle Stability"}] as const;
const board: Leaderboard = {
  benchmark: 'cyc3d', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: "The paper reports no overall score, so this is the plain mean of its seven evaluation dimensions.",
  parts: Object.fromEntries(columns.map(column => [column.key, column.name])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid)
      .find(t => JSON.stringify(t[1]) === "[\"Method\",\"Type\",\"Geo. Struct. \\\\uparrow\",\"Ref-View Fid. \\\\uparrow\",\"Mesh Qual. \\\\uparrow\",\"Mesh Effic. \\\\uparrow\",\"UV Param. \\\\uparrow\",\"Object Consist. \\\\uparrow\",\"Cycle Stab. \\\\uparrow\"]");
    if (!table) throw Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const model = cells[0];
      const metrics: Record<string, number> = {};
      for (const { key, index, scale } of columns) {
        const value = cells[index]?.trim().replace(/%$/, '');
        if (!value || !Number.isFinite(Number(value))) throw Error('Invalid ' + key + ' for ' + model);
        metrics[key] = Number(value) * scale;
      }
      rows.push({ model, score: Object.values(metrics).reduce((sum, value) => sum + value, 0) / columns.length, metrics, open: cells[1] === 'Open' });
    }
    return checked(rows, 5);
  },
};
export default board;
