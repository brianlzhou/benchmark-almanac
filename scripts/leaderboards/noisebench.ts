// NoiseBench: judgment inconsistency (noise) across 100 live Polymarket forecasting questions.
// Reads https://noisebench.com/data/metrics.json (MIT license). Lower noise is better.
// Live page draws a log-scale "Noise vs cost" scatter chart (US dollars per answer vs overall noise).
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://noisebench.com/';
const FEED = 'https://noisebench.com/data/metrics.json';
const RUN_FEED = 'https://noisebench.com/data/run.json';

interface NoiseModel {
  model: string;
  noise: number;
  averageError?: number;
  negationError?: number;
  pairwiseDisagreement?: number;
  negationDisagreement?: number;
  individualPairDisagreement?: number;
  drift?: number;
  yes?: number;
  aRate?: number;
  rankCouple?: number;
  sumCouple?: number;
  forecasts?: number;
  judgments?: number;
  markets?: number;
  ties?: number;
  costPerAnswer?: number;
  costPerForecast?: number;
  costPerJudgment?: number;
  tokensOut?: number;
  reasoningTokens?: number;
  consistencyPerDollar?: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

const board: Leaderboard = {
  benchmark: 'noisebench',
  url: PAGE,
  feed: FEED,
  terms: 'Public MIT-licensed JSON endpoints published at noisebench.com/data/.',
  aliases: {
    'mistralai/mistral-large-2512': 'mistral-large-3',
  },
  chart: {
    title: 'Noise vs cost',
    x: { key: 'cost', label: 'Cost per answer', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Judgment noise', unit: '%', better: 'lower' },
    note: 'Overall judgment noise across 100 Polymarket questions against API cost per answer.',
  },
  parts: {
    averageError: { name: 'Odds spread', group: 'Component', better: 'lower' },
    negationError: { name: 'Negated spread', group: 'Component', better: 'lower' },
    pairwiseDisagreement: { name: 'Pairwise disagreement', group: 'Component', better: 'lower' },
    negationDisagreement: { name: 'Negation disagreement', group: 'Component', better: 'lower' },
    individualPairDisagreement: { name: 'Individual-pair disagreement', group: 'Component', better: 'lower' },
  },
  stats: {
    drift: { name: 'Negation drift', unit: '%', note: 'Signed average difference between Yes and 1 minus No probabilities.' },
    yesMean: { name: 'Mean Yes forecast', unit: '%' },
    firstOptionRate: { name: 'First-option pick rate', unit: '%', note: 'Share of pairwise comparisons picking the first-listed market.' },
    rankCouple: { name: 'Rank-couple violation', unit: '%', better: 'lower' },
    sumCouple: { name: 'Sum-couple violation', unit: '%', better: 'lower' },
    reasoningTokens: { name: 'Reasoning tokens', unit: 'tokens', better: 'lower' },
    costPerForecast: { name: 'Cost per forecast', unit: 'usd', better: 'lower' },
    costPerJudgment: { name: 'Cost per pairwise judgment', unit: 'usd', better: 'lower' },
    consistencyPerDollar: { name: 'Consistency per dollar', unit: 'score', better: 'higher' },
    markets: { name: 'Markets completed', unit: 'count', better: 'higher' },
    forecasts: { name: 'Forecasts completed', unit: 'count', better: 'higher' },
    judgments: { name: 'Pairwise judgments completed', unit: 'count', better: 'higher' },
    ties: { name: 'Pairwise ties', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const [mRes, rRes] = await Promise.all([
      fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } }),
      fetch(RUN_FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } }).catch(() => null),
    ]);
    if (!mRes.ok) throw new Error(`NoiseBench metrics.json: ${mRes.status}`);
    const data = (await mRes.json()) as { models: NoiseModel[] };
    let runDate: string | undefined;
    if (rRes?.ok) {
      const runInfo = (await rRes.json()) as { completedAt?: string; startedAt?: string };
      const rawDate = runInfo.completedAt || runInfo.startedAt;
      if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        runDate = rawDate.slice(0, 10);
      }
    }

    const rows: LeaderboardRow[] = [];
    for (const m of data.models ?? []) {
      if (!m.model || typeof m.noise !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof m.averageError === 'number') metrics.averageError = r2(m.averageError * 100);
      if (typeof m.negationError === 'number') metrics.negationError = r2(m.negationError * 100);
      if (typeof m.pairwiseDisagreement === 'number') metrics.pairwiseDisagreement = r2(m.pairwiseDisagreement * 100);
      if (typeof m.negationDisagreement === 'number') metrics.negationDisagreement = r2(m.negationDisagreement * 100);
      if (typeof m.individualPairDisagreement === 'number') metrics.individualPairDisagreement = r2(m.individualPairDisagreement * 100);
      if (typeof m.drift === 'number') metrics.drift = r2(m.drift * 100);
      if (typeof m.yes === 'number') metrics.yesMean = r2(m.yes * 100);
      if (typeof m.aRate === 'number') metrics.firstOptionRate = r2(m.aRate * 100);
      if (typeof m.rankCouple === 'number') metrics.rankCouple = r2(m.rankCouple * 100);
      if (typeof m.sumCouple === 'number') metrics.sumCouple = r2(m.sumCouple * 100);
      if (typeof m.reasoningTokens === 'number') metrics.reasoningTokens = Math.round(m.reasoningTokens);
      if (typeof m.costPerForecast === 'number') metrics.costPerForecast = r6(m.costPerForecast);
      if (typeof m.costPerJudgment === 'number') metrics.costPerJudgment = r6(m.costPerJudgment);
      if (typeof m.consistencyPerDollar === 'number') metrics.consistencyPerDollar = r2(m.consistencyPerDollar);
      if (typeof m.markets === 'number') metrics.markets = m.markets;
      if (typeof m.forecasts === 'number') metrics.forecasts = m.forecasts;
      if (typeof m.judgments === 'number') metrics.judgments = m.judgments;
      if (typeof m.ties === 'number') metrics.ties = m.ties;

      const row: LeaderboardRow = {
        model: m.model,
        score: r2(m.noise * 100),
        metrics,
      };
      if (runDate) row.date = runDate;
      if (typeof m.costPerAnswer === 'number') row.cost = r6(m.costPerAnswer);
      if (typeof m.tokensOut === 'number') row.tokens = Math.round(m.tokensOut);
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('NoiseBench: parsed zero rows');
    return rows;
  },
};

export default board;
