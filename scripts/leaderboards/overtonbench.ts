// OvertonBench ranks models by the full dataset's unweighted OvertonScore. Its embedded results include two datasets, weighted scores and bootstrap intervals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
interface Score {id: string; score: number; ci_lo: number; ci_hi: number}

const feed = "https://overtonbench.github.io/#results";
const board: Leaderboard = {
  benchmark: 'overtonbench',
  url: "https://overtonbench.github.io/#results",
  feed,
  terms: "The site has no robots file. The site identifies an MIT license. The authors release the human ratings under CC BY 4.0. https://huggingface.co/datasets/elinorpd/overtonbench",
  parts: { modelslant: 'ModelSlant', prism: 'PRISM' },
  stats: {
    weighted: { name: 'Weighted OvertonScore', unit: 'score', better: 'higher' },
    modelslantWeighted: { name: 'Weighted ModelSlant score', unit: 'score', better: 'higher' },
    prismWeighted: { name: 'Weighted PRISM evaluation score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const page = await fetchText(feed);
    const labels = new Map([...page.matchAll(/"([^"]+)"\s*:\s*\{\s*display:\s*"([^"]+)"/g)].map(m => [m[1], m[2]]));
    const literal = page.match(/const RESULTS = (\{[\s\S]*?\n\});/)?.[1];
    if (!literal) throw new Error('Missing OvertonBench results');
    const data: Record<string, Record<string, Score[]>> = JSON.parse(literal.replace(/\b(\w+)\s*:/g, '"$1":').replace(/,\s*([}\]])/g, '$1'));
    if (data.full.unweighted.length < 8) throw new Error('Missing OvertonBench models');
    return data.full.unweighted.map(r => {
      const model = labels.get(r.id), metrics: Record<string, number> = {};
      if (!model || ![r.score, r.ci_lo, r.ci_hi].every(Number.isFinite)) throw new Error('Invalid full score');
      for (const group of ['full', 'modelslant', 'prism']) {
        for (const method of ['unweighted', 'weighted']) {
          if (group === 'full' && method === 'unweighted') continue;
          const x = data[group][method].find(x => x.id === r.id);
          if (!x || ![x.score, x.ci_lo, x.ci_hi].every(Number.isFinite)) throw new Error('Missing score breakdown');
          const key = group === 'full' ? method : group + (method === 'weighted' ? 'Weighted' : '');
          metrics[key] = x.score;
          metrics[key + 'Low'] = x.ci_lo;
          metrics[key + 'High'] = x.ci_hi;
        }
      }
      return { model, score: r.score, low: r.ci_lo, high: r.ci_hi, metrics };
    });
  },
};
export default board;
