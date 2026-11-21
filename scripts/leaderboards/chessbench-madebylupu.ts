// ChessBench rates chess-playing models and reasoning settings with Glicko-2.
// Its public leaderboard JSON includes game results, rating deviation, timing, token use and cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://chessbench.org/data/leaderboard.json";

const board: Leaderboard = {
  benchmark: "chessbench-madebylupu",
  url: "https://chessbench.org/",
  feed,
  terms: "The terms allow sharing links with attribution to ChessBench and MadeByLupu. They give no explicit bulk republication license. https://chessbench.org/terms Robots.txt allows the public data path.",
  stats: { deviation: { name: 'Rating deviation', unit: 'rating', better: 'lower' }, volatility: { name: 'Rating volatility', unit: 'rating', better: 'lower' }, wins: { name: 'Wins', unit: 'count' }, draws: { name: 'Draws', unit: 'count' }, losses: { name: 'Losses', unit: 'count' }, runs: { name: 'Runs', unit: 'count' }, legal: { name: 'Legal moves', unit: 'count', better: 'higher' }, illegal: { name: 'Illegal moves', unit: 'count', better: 'lower' }, illegalRate: { name: 'Illegal move rate', unit: '%', better: 'lower' }, pricedRuns: { name: 'Priced runs', unit: 'count' }, unknownRuns: { name: 'Unknown runs', unit: 'count' }, outputTokens: { name: 'Output tokens', unit: 'tokens' }, cost: { name: 'Average cost', unit: 'usd', better: 'lower' }, avgTime: { name: 'Average move time', unit: 'seconds', better: 'lower' }, latency: { name: 'Average move latency', unit: 'seconds', better: 'lower' }, thinkingBudget: { name: 'Thinking budget', unit: 'tokens' } },
  async fetch() {
    type Setup = Record<string, unknown> & { name: string; rating: number; effort: string; games: number;
      avgCost: number | null; avgOutputTokens: number; avgMoveTime: number; thinkingBudget: number };
    type Model = { name: string; url: string; updatedAt: string; setups: Setup[] };
    const data = await fetchJson<{ protocol: string; ratingSystem: string; models: Model[] }>(feed);
    if (data.protocol !== 'chessbench-v3' || data.ratingSystem !== 'Glicko-2' || data.models.length < 18) throw new Error('ChessBench format changed');
    const rows = data.models.flatMap(model => model.setups.map(s => {
      if (!s.name || !s.effort || !Number.isFinite(s.rating) || !Number.isFinite(s.avgMoveTime) || !model.url)
        throw new Error('Invalid ChessBench setup');
      const metrics: Record<string, number> = { latency: s.avgMoveTime / 1000 };
      for (const key of ['deviation','volatility','wins','draws','losses','runs','legal','illegal','illegalRate','pricedRuns',
          'unknownRuns','outputTokens','cost','avgTime','thinkingBudget']) {
        const value = s[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing chess statistic: ' + key);
        metrics[key] = value;
      }
      return { model: s.name, setting: s.effort + (s.thinkingBudget ? ' (' + s.thinkingBudget + ' tokens)' : ''),
        score: s.rating, trials: s.games, date: model.updatedAt.slice(0, 10), link: model.url,
        cost: s.avgCost ?? undefined, tokens: s.avgOutputTokens, metrics };
    }));
    if (rows.length < 32) throw new Error('Missing ChessBench setups');
    return rows;
  },
};

export default board;
