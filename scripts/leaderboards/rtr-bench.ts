// RTR-bench (1999labs): human audience distribution prediction (Predict) and few-shot audience learning (Learn).
// Reads results/final-8000/verified-results.json (sole verified source of the public tables and Pareto scatter plots).
// Source verbatim 95% interval definition (results/final-8000/README.md):
//   "Exploratory 95% interval ... Intervals resample matched target entity groups."
// Repo charts (results/predict-learn-scatter.json) draw log-scale cost vs score Pareto frontiers for Predict and Learn.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://github.com/1999labs/RTR-bench/blob/main/results/final-8000/README.md';
const FEED = 'https://raw.githubusercontent.com/1999labs/RTR-bench/main/results/final-8000/verified-results.json';

interface RtrSummary {
  strategy: string;
  score: number;
  scoreCI?: [number, number];
  valid?: number;
  costUsd?: { known: number; unknownAttempts: number };
  apiCalls?: number;
}

interface RtrResult {
  model: string;
  provider?: string;
  quantization?: string;
  directory?: string;
  summaries: RtrSummary[];
  learnGain?: number;
  reportedCostUsd?: number;
  elapsedMinutes?: number;
  maxCompletionTokens?: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r5 = (n: number) => Math.round(n * 1e5) / 1e5;

const board: Leaderboard = {
  benchmark: 'rtr-bench',
  url: PAGE,
  feed: FEED,
  terms: 'Public CC0-1.0 dataset and independently verified JSON results in the 1999labs/RTR-bench GitHub repository.',
  costPer: 'run',
  chart: {
    title: 'Predict score vs cost',
    x: { key: 'cost', label: 'Predict track cost', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Predict score', better: 'higher' },
    note: 'Zero-shot Predict distribution agreement score out of 100 against known USD subtotal across 45 evaluation targets.',
  },
  parts: {
    learn: { name: 'Learn', group: 'Strategy', note: 'Agent chooses up to 3 historical crowd examples across 8 actions.' },
    randomExamples: { name: 'Random examples', group: 'Strategy', note: 'Control condition with 3 random historical crowd examples.' },
    similarExamples: { name: 'Similar examples', group: 'Strategy', note: 'Control condition with 3 text-similar historical crowd examples.' },
  },
  stats: {
    learnGain: { name: 'Learn gain', unit: 'score', better: 'higher', note: 'Difference between Learn and Predict scores.' },
    learnCost: { name: 'Learn track cost', unit: 'usd', better: 'lower' },
    totalCost: { name: 'Total run cost', unit: 'usd', better: 'lower', note: 'Reported USD spend across all four conditions.' },
    predictValid: { name: 'Valid Predict answers', unit: 'count', better: 'higher', note: 'Valid outputs out of 45 evaluation targets.' },
    learnValid: { name: 'Valid Learn answers', unit: 'count', better: 'higher', note: 'Valid outputs out of 45 evaluation targets.' },
    learnApiCalls: { name: 'Learn API calls', unit: 'count', better: 'lower' },
    elapsedMinutes: { name: 'Elapsed time', unit: 'minutes', better: 'lower' },
    maxCompletionTokens: { name: 'Max completion tokens', unit: 'tokens', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`RTR-bench verified-results.json: ${res.status}`);
    const data = (await res.json()) as { results: RtrResult[] };

    const rows: LeaderboardRow[] = [];
    for (const r of data.results ?? []) {
      const byStrat = new Map(r.summaries.map((s) => [s.strategy, s]));
      const pred = byStrat.get('none');
      const learn = byStrat.get('agent');
      const rand = byStrat.get('random');
      const sim = byStrat.get('similar');
      if (!r.model || !pred || typeof pred.score !== 'number') continue;

      const metrics: Record<string, number> = {};
      if (learn && typeof learn.score === 'number') metrics.learn = r2(learn.score);
      if (rand && typeof rand.score === 'number') metrics.randomExamples = r2(rand.score);
      if (sim && typeof sim.score === 'number') metrics.similarExamples = r2(sim.score);
      if (typeof r.learnGain === 'number') metrics.learnGain = r2(r.learnGain);
      if (typeof learn?.costUsd?.known === 'number') metrics.learnCost = r5(learn.costUsd.known);
      if (typeof r.reportedCostUsd === 'number') metrics.totalCost = r5(r.reportedCostUsd);
      if (typeof pred.valid === 'number') metrics.predictValid = pred.valid;
      if (typeof learn?.valid === 'number') metrics.learnValid = learn.valid;
      if (typeof learn?.apiCalls === 'number') metrics.learnApiCalls = learn.apiCalls;
      if (typeof r.elapsedMinutes === 'number') metrics.elapsedMinutes = r2(r.elapsedMinutes);
      if (typeof r.maxCompletionTokens === 'number') metrics.maxCompletionTokens = r.maxCompletionTokens;

      const row: LeaderboardRow = {
        model: r.model,
        score: r2(pred.score),
        metrics,
      };
      if (r.provider) row.setting = r.provider;
      if (pred.scoreCI && pred.scoreCI.length === 2) {
        row.low = r2(pred.scoreCI[0]);
        row.high = r2(pred.scoreCI[1]);
      }
      if (typeof pred.costUsd?.known === 'number') row.cost = r5(pred.costUsd.known);
      if (r.directory) {
        row.link = `https://github.com/1999labs/RTR-bench/blob/main/${r.directory}/README.md`;
      }
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('RTR-bench: parsed zero rows');
    return rows;
  },
};

export default board;
