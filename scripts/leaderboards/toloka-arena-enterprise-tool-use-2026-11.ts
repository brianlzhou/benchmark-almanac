// Toloka Arena Enterprise Tool Use measures reliable completion of enterprise workflows.
// The headline is pass^5, the share of tasks that pass all five attempts, in percent.
// This importer reads the official leaderboard, cost and token JSON files from Toloka's public Azure feed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://toloka.ai/arena-enterprise';
const BASE = 'https://prodtlkdeliverytechfiles.blob.core.windows.net/arena-public-prod/v3';
const FEED = `${BASE}/leaderboard_data.json`;

interface Entry {
  name: string;
  score: number;
  ciLow: number;
  ciHigh: number;
  passAtK: Record<string, number>;
  passHatK: Record<string, number>;
}

interface CostEntry {
  name: string;
  cost: number;
  costPerTask: number;
}

interface TokenEntry {
  name: string;
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
}

const board: Leaderboard = {
  benchmark: 'toloka-arena-enterprise-tool-use-2026-11',
  url: PAGE,
  feed: FEED,
  terms: 'Toloka publishes the board and feed publicly. Its robots.txt allows the page. The page gives no separate score reuse license.',
  reference: ['tolokaforge'],
  chart: {
    title: 'Performance vs. cost',
    x: { key: 'costPerTask', label: 'Average cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Reliability score (pass^5)', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const entries = await fetchJson<Entry[]>(FEED);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const costs = await fetchJson<CostEntry[]>(`${BASE}/cost_data.json`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const tokens = await fetchJson<TokenEntry[]>(`${BASE}/token-usage.json`);
    const costByName = new Map(costs.map(entry => [entry.name, entry]));
    const tokensByName = new Map(tokens.map(entry => [entry.name, entry]));
    if (new Set(entries.map(entry => entry.name)).size < 46) throw new Error('Toloka Arena Enterprise: expected at least 46 models');
    return entries.map((entry) => {
      const cost = costByName.get(entry.name);
      const usage = tokensByName.get(entry.name);
      if (!entry.name || !cost || !usage) throw new Error(`Toloka Arena Enterprise: missing data for ${entry.name}`);
      const metrics: Record<string, number> = {
        costPerTask: cost.costPerTask,
        totalCost: cost.cost,
        inputTokensMillions: usage.tokensIn,
        outputTokensMillions: usage.tokensOut,
        totalTokensMillions: usage.tokensTotal,
      };
      for (let k = 1; k <= 5; k++) {
        metrics[`passAt${k}`] = entry.passAtK[`k${k}`];
        metrics[`passHat${k}`] = entry.passHatK[`k${k}`];
      }
      if (![entry.score, entry.ciLow, entry.ciHigh, ...Object.values(metrics)].every(Number.isFinite)) {
        throw new Error(`Toloka Arena Enterprise: invalid scores or resource data for ${entry.name}`);
      }
      return {
        model: entry.name,
        score: entry.score,
        low: entry.ciLow,
        high: entry.ciHigh,
        cost: cost.costPerTask,
        harness: 'tolokaforge',
        trials: 5,
        metrics,
      };
    });
  },
};

export default board;
