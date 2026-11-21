// The source reports no overall score. The headline is the plain mean of the 9 parts, computed by this importer.
// NarrLV scores fidelity, coverage and coherence of video narratives under three change factors.
// Tables 1 and A7 report the nine scores on the same scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2507.11245';
const measures = ['Narrative element fidelity', 'Narrative unit coverage', 'Narrative unit coherence'];
const factors = ['Scene attribute changes', 'Target attribute changes', 'Target action changes'];
const board: Leaderboard = {
  static: 'paper',
  benchmark: 'narrlv', url: 'https://amap-ml.github.io/NarrLV-Website/', feed,
  terms: 'Authors retain copyright under the license linked from https://arxiv.org/abs/2507.11245.',
  headline: 'Plain mean of nine scores covering three narrative measures and three change factors.',
  aliases: { Wan: 'wan2-1-t2v-14b' },
  parts: Object.fromEntries(measures.flatMap((group, i) => factors.map((name, j) => ['m' + i + 'f' + j, { name, group }]))),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid).filter(t => t[0]?.[0] === 'Model' &&
      t[0].length === 10 && t[0][1].includes('fid') && t[0][4].includes('cov') && t[0][7].includes('coh'));
    if (tables.length !== 2) throw new Error('Missing NarrLV comparison tables');
    const rows: LeaderboardRow[] = [];
    for (const t of tables) {
      const order = ['s_{att}', 't_{att}', 't_{act}'];
      if (!t[1].slice(1).every((v, i) => v.includes(order[i % 3]))) throw new Error('Changed factor order');
      for (const [model, ...cells] of t.slice(2)) {
        if (model === 'Mean' || model.endsWith('video generation models')) continue;
        if (cells.length !== 9 || cells.some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid NarrLV row');
        const values = cells.map(Number);
        const metrics = Object.fromEntries(values.map((v, i) => ['m' + Math.floor(i / 3) + 'f' + (i % 3), v]));
        rows.push({ model, score: values.reduce((a, b) => a + b) / 9, metrics });
      }
    }
    return checked(rows, 14);
  },
};
export default board;
