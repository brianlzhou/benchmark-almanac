// JFinBench scores Japanese finance exam questions. The site reads its overall and per-exam scores from data.js.
// Each configuration reports the mean and standard deviation across runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://pub.sakana.ai/jfinbench/data.js";

type Result = { score: number; std: number; cost: number; tok: number; turns?: number; turnsMed?: number; settings: {runs: number}; exams: Record<string,{score: number}> };
type Model = { name: string; type: string; maxLabel: string; lowLabel: string; max: Result; tools: Result; low?: Result };
const parts = { CPA: 'CPA', Tax: 'Tax accountant', FP: 'FP', Counter: 'Counter services', Nissho: 'Nissho Bookkeeping', Zensho: 'Zensho Bookkeeping' };

const board: Leaderboard = {
  benchmark: "jfinbench",
  stats: { turns: { name: 'Mean turns', unit: 'count', better: 'lower' }, medianTurns: { name: 'Median turns', unit: 'count', better: 'lower' } },
  url: "https://pub.sakana.ai/jfinbench/#leaderboard",
  feed: FEED,
  terms: "The leaderboard page gives no separate reuse license. https://pub.sakana.ai/jfinbench/#leaderboard",
  parts,
  async fetch() {
    const data = jsonAfter<{ models: Model[] }>(await fetchText(FEED), 'window.JFB =');
    const rows: LeaderboardRow[] = [];
    for (const m of data.models) {
      for (const config of ['max', 'low', 'tools'] as const) {
        const r = m[config];
        if (config === 'low' && !r) continue;
        if (!r || ![r.score, r.std, r.cost, r.tok, r.settings.runs].every(Number.isFinite)) throw new Error('Missing JFinBench configuration for ' + m.name);
        const metrics: Record<string,number> = { std: r.std };
        for (const exam of Object.keys(parts)) {
          if (!Number.isFinite(r.exams[exam]?.score)) throw new Error('Missing exam ' + exam);
          metrics[exam] = r.exams[exam].score;
        }
        if (r.turns != null) metrics.turns = r.turns;
        if (r.turnsMed != null) metrics.medianTurns = r.turnsMed;
        const setting = config === 'low' ? m.lowLabel : config === 'tools' ? m.maxLabel + ', with tools' : m.maxLabel;
        rows.push({ model: m.name, setting, score: r.score, cost: r.cost, tokens: Math.round(r.tok * 1000), trials: r.settings.runs, open: m.type !== 'proprietary', metrics });
      }
    }
    if (data.models.length < 12 || rows.length < 30) throw new Error('Incomplete JFinBench results');
    return rows;
  },
};
export default board;
