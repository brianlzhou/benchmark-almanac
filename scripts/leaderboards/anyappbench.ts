// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// AnyAppBench tests mobile agents on the same tasks across different apps. Its leaderboard gives success rates
// on original and new apps for each template group. The spread and transfer gap are additional statistics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://anyappbench.github.io/static/js/data.js';
const board: Leaderboard = {
  benchmark: 'anyappbench', url: 'https://anyappbench.github.io/#leaderboard', feed,
  terms: 'The project site credits its content under CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  parts: {
    awOriginal: { name: 'AW app', group: 'AW-inherited templates' },
    awNew: { name: 'New apps', group: 'AW-inherited templates' },
    newOriginal: { name: 'AW app', group: 'New AnyAppBench templates' },
    newNew: { name: 'New apps', group: 'New AnyAppBench templates' },
  },
  async fetch() {
    const text = await fetchText(feed);
    const data = text.match(/^window\.AAB_LEADERBOARD = (.+);$/m);
    if (!data || !text.includes('Table 1')) throw new Error('Missing leaderboard data for Table 1');
    const { rows } = JSON.parse(data[1]) as { rows: { model: string, family: string, vals: number[] }[] };
    return checked(rows.map(({ model, family, vals }) => {
      if (vals.length !== 8 || !vals.every(Number.isFinite)) throw new Error('Invalid Table 1 columns');
      const [awOriginal, awNew, awStd, awDelta, newOriginal, newNew, newStd, newDelta] = vals;
      const hybrid = family === 'Hybrid';
      const planner = model.replace(/†$/, '');
      return { model: planner, score: (awOriginal + awNew + newOriginal + newNew) / 4,
        models: hybrid ? [planner, 'UI-Venus-Ground-72B'] : undefined,
        harness: hybrid ? 'Hybrid with UI-Venus-Ground-72B' : undefined,
        metrics: { awOriginal, awNew, awStd, awDelta, newOriginal, newNew, newStd, newDelta } };
    }), 13);
  },
};
export default board;
