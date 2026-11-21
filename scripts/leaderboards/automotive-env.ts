// Automotive-ENV tests multimodal models on cockpit interaction and safety-aware reasoning across four task subsets.
// The source reports no overall score. The headline is the plain mean of the four success-rate parts, computed by this importer.
// The importer reads the authors' published results CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://automotive-env.github.io/assets/results.csv';
const board: Leaderboard = {
  benchmark: 'automotive-env', static: 'paper',
  url: 'https://automotive-env.github.io/#results', feed: FEED,
  terms: 'The repository uses Apache License 2.0. https://github.com/MadMax3366/Automotive_Env_Neurips2026/blob/master/LICENSE',
  headline: 'The source reports no overall score, so this is the plain mean of its four success-rate parts.',
  stats: { secondsPerTask:{name:'Time per task',unit:'seconds',better:'lower'}, secondsPerStep:{name:'Time per step',unit:'seconds',better:'lower'}, steps:{name:'Steps',unit:'count',better:'lower'} },
  parts: {
    generalExplicit: { name: 'General Explicit SR', group: 'Task subset', unit: '%' },
    generalImplicit: { name: 'General Implicit SR', group: 'Task subset', unit: '%' },
    safetyExplicit: { name: 'Safety Explicit SR', group: 'Task subset', unit: '%' },
    safetyImplicit: { name: 'Safety Implicit SR', group: 'Task subset', unit: '%' },
  },
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    const out: LeaderboardRow[] = rows.map((r) => {
      const values = ['General Explicit SR (%)', 'General Implicit SR (%)', 'Safety Explicit SR (%)', 'Safety Implicit SR (%)'].map((k) => Number(r[k]));
      if (!r.Model || values.some((v) => !Number.isFinite(v))) throw new Error(`Invalid Automotive-ENV row for ${r.Model}`);
      return { model: r.Model, score: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(4)), metrics: { generalExplicit: values[0], generalImplicit: values[1], safetyExplicit: values[2], safetyImplicit: values[3], timePerTask: Number(r['Time per task (s)']), timePerStep: Number(r['Time per step (s)']), steps: Number(r.Steps) } };
    });
    if (out.length < 2) throw new Error('Expected at least two Automotive-ENV rows');
    return out;
  },
};
export default board;
