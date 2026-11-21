// FrontierML agents train models under a fixed budget. The board shows the mean score on a 0–100 scale.
// Its page supplies one entry per model and wallet size, including average compute and API spend per task.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

const url = 'https://www.frontierml.org/';
interface Model { name: string; harness: string; effort: string; version?: string }
interface Entry {
  model: Model | string; budget: number; score: number; graded: number; total: number; zeros: number;
  compute: number; api: number; hours: number; steps: number; outputTokens: number;
}
const board: Leaderboard = {
  benchmark: 'frontier-ml', url, feed: url, terms: 'Public scores published by Induction Labs on FrontierML.',
  async fetch() {
    const entries = jsonAfter<Entry[]>(nextFlight(await fetchText(url)), '"entries":');
    if (entries.length < 57) throw new Error('Missing FrontierML wallet results');
    return entries.map(e => {
      const ref = typeof e.model === 'string' && e.model.match(/:entries:(\d+):model$/);
      const m = ref ? entries[Number(ref[1])]?.model : e.model;
      if (!m || typeof m === 'string' || !m.name || ![e.score, e.api, e.compute, e.budget, e.outputTokens].every(Number.isFinite)) throw new Error('Invalid FrontierML entry');
      return { model: m.version ? `${m.name} (${m.version})` : m.name, harness: m.harness,
        setting: `$${e.budget} wallet · ${m.effort}`, score: e.score * 100, cost: e.api + e.compute, tokens: e.outputTokens,
        metrics: { walletSpend: e.compute, modelCost: e.api, seconds: e.hours * 3600, steps: e.steps, graded: e.graded, total: e.total, zeros: e.zeros } };
    });
  },
};
export default board;
