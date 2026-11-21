// Itzi reports local robustness across eight roleplay episodes. The model cards list this component separately from the composite quality ranking.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://itzi.app/benchmarks/roleplay";
const board: Leaderboard = {
  benchmark: 'itzi-roleplay-local-robustness',
  stats: { medianSeconds: { name: 'Median episode duration', unit: 'seconds', better: 'lower' }, p95Seconds: { name: '95th percentile episode duration', unit: 'seconds', better: 'lower' } },
  url: "https://itzi.app/benchmarks/roleplay",
  feed,
  terms: "The robots file explains content signals and lists no blocked paths. Itzi protects its original site materials. Run costs are estimates calculated at public rates. https://itzi.app/terms",
  costPer: 'run',
  async fetch() {
    const source = await fetchText(feed);
    const rows = [];
    for (const [article] of source.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)) {
      const label = text(article);
      if (!label.includes('Robustness ')) continue;
      const model = text(article.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1] || '');
      const score = label.match(/Robustness ([\d.]+) at/);
      const cost = label.match(/\$([\d.]+) Itzi estimate/);
      const latency = label.match(/Median ([\d.]+)s P95 ([\d.]+)s/);
      if (!model || !score || !cost || !latency) throw new Error('Incomplete robustness card for ' + model);
      rows.push({ model, score: Number(score[1]), cost: Number(cost[1]), metrics: { medianSeconds: Number(latency[1]), p95Seconds: Number(latency[2]) } });
    }
    if (rows.length < 36) throw new Error('Missing robustness cards');
    return rows;
  },
};
export default board;
