// Eigenform ranks models by their mean rubric score across 150 geology questions.
// The full results page embeds overall scores, district means, intervals and cost for the complete run.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://www.eigenform.ai/benchmark/results/";
interface Score { mean: number; ci: [number, number] }
interface Data {
  stats: { models: number }; sites: {key: string; label: string}[];
  leaderboard: (Score & {key: string; name: string; total: number; perSite: Record<string,Score>})[];
  difficulty: Record<string,Record<string,Record<string,number>>>;
  pareto: {key: string; cost: number; gen: number; judge: number}[];
  effort: {key: string; calls: number; latency: number}[];
}

const board: Leaderboard = {
  benchmark: "groundtruth-geology",
  url: "https://www.eigenform.ai/benchmark/",
  feed,
  terms: "The leaderboard metadata specifies MIT. The submissions dataset does not state a separate license. https://www.eigenform.ai/benchmark/ Eigenform allows crawling.",
  costPer: 'run',
  stats: {
    total: { name: 'Total rubric points', unit: 'score', better: 'higher' },
    toolCalls: { name: 'Tool calls', unit: 'count' },
    medianLatency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    generationCost: { name: 'Generation cost', unit: 'usd', better: 'lower' },
    judgingCost: { name: 'Judging cost', unit: 'usd', better: 'lower' },
  },
  async fetch() {
    const source = (await fetchText(feed)).match(/<script[^>]*id="data"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!source) throw new Error('Missing full results');
    const d = JSON.parse(source) as Data;
    if (d.leaderboard.length < 8 || d.leaderboard.length !== d.stats.models) throw new Error('Incomplete model rankings');
    board.parts = Object.fromEntries(d.sites.map(site => [site.key, site.label]));
    return d.leaderboard.map(row => {
      const price = d.pareto.find(p => p.key === row.key);
      const effort = d.effort.find(e => e.key === row.key);
      if (!price || !effort || !Number.isFinite(row.mean)) throw new Error('Missing run details: ' + row.name);
      const metrics: Record<string, number> = { total: row.total, toolCalls: effort.calls, medianLatency: effort.latency,
        generationCost: price.gen, judgingCost: price.judge };
      for (const site of d.sites) {
        const s = row.perSite[site.key];
        metrics[site.key] = s.mean;
        metrics[site.key + 'Low'] = s.ci[0];
        metrics[site.key + 'High'] = s.ci[1];
        for (const [difficulty, scores] of Object.entries(d.difficulty[site.key])) {
          const key = site.key + difficulty;
          board.parts![key] = { name: difficulty, group: site.label };
          if (Number.isFinite(scores[row.key])) metrics[key] = scores[row.key];
        }
      }
      return { model: row.name, score: row.mean, low: row.ci[0], high: row.ci[1], cost: price.cost, metrics };
    });
  },
};
export default board;
