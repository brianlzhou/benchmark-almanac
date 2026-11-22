// GIFT-Eval-CTX ranks forecasting methods by relative MASE. The Space API publishes overall and horizon scores and the dataset groups behind its filters.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://salesforce-gift-eval-ctx.hf.space/api/leaderboard";
interface Data {
  methods: {id: string; name: string; input: string; category?: string}[];
  groups: {dataset: string; term: string; relative_mase: Record<string, number>}[];
  summaries: Record<string, Record<string, number>>;
  stats: {methods: number; groups: number};
}

const board: Leaderboard = {
  benchmark: "gift-eval-ctx",
  url: "https://huggingface.co/spaces/Salesforce/GIFT-Eval-CTX",
  feed: FEED,
  harnesses: 'system',
  terms: "The Space lists Apache 2.0 for the repository and identifies research as its intended use. https://huggingface.co/spaces/Salesforce/GIFT-Eval-CTX/blob/main/README.md",
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    if (data.methods.length < 15 || data.methods.length !== data.stats.methods || data.groups.length !== data.stats.groups)
      throw new Error('Incomplete GIFT-Eval-CTX leaderboard');
    const parts = { short: 'Short', medium: 'Medium', long: 'Long' };
    board.parts = { ...parts };
    return data.methods.map(({ id, name, input, category }) => {
      const score = data.summaries.overall[id];
      const metrics: Record<string, number> = Object.fromEntries(Object.keys(parts).map(k => [k, data.summaries[k][id]]));
      for (const dataset of new Set(data.groups.map(g => g.dataset))) {
        const values = data.groups.filter(g => g.dataset === dataset).map(g => g.relative_mase[id]);
        metrics[dataset] = values.includes(0) ? 0 : Math.exp(values.reduce((s, v) => s + Math.log(v), 0) / values.length);
        board.parts![dataset] = { name: dataset, group: 'Dataset' };
      }
      if (![score, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Missing MASE for ' + name);
      const agent = category === 'Agent' && name.match(/^([^()]+?)\s+\(([^()]+)\)$/);
      if (agent) return { model: agent[2].trim(), harness: agent[1].trim(), setting: input, score, metrics };
      return { model: name, setting: input, score, metrics };
    });
  },
};
export default board;
