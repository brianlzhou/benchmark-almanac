// PlotPoints ranks twelve-turn roleplay sessions by blind-vote Elo. The round-two API supplies the rating, interval and vote count.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://plotlightstudios.com/api/plotpoints/leaderboard?round=2&test=multiturn";

const board: Leaderboard = {
  benchmark: "plotpoints-round-2",
  url: "https://plotlightstudios.com/plotpoints/leaderboard?round=2",
  feed,
  terms: "PlotPoints labels its public results CC BY 4.0. The repository and Hugging Face dataset list CC BY-NC 4.0. https://plotlightstudios.com/plotpoints https://huggingface.co/datasets/lazyweasel/roleplay-bench robots.txt disallows /api/.",
  stats: {
    votes: { name: 'Votes', unit: 'count' },
    costPer1m: { name: 'Cost per million tokens', unit: 'usd-per-mtok', better: 'lower' },
    latencySeconds: { name: 'Latency', unit: 'seconds', better: 'lower' },
    rubric: { name: 'Rubric score', unit: 'score', better: 'higher', note: 'Judge rubric rating out of 5.' },
    engagement: { name: 'Engagement score', unit: 'score', better: 'higher', note: 'Judge engagement rating out of 5.' },
    failureAvg: { name: 'Average failure score', unit: 'score', better: 'lower' },
    compositeScore: { name: 'Composite score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    type Model = { name: string, access: string, multiturnElo?: number, multiturnPm: number, multiturnVotes: number, costPer1m?: number, latencyMs?: number, rubric?: number, engagement?: number, failureAvg?: number, compositeScore?: number };
    const d = await fetchJson<{test: string, models: Model[]}>(feed);
    const ranked = d.models.filter(r => typeof r.multiturnElo === 'number');
    if (d.test !== 'multiturn' || ranked.length < 20) throw new Error('Missing multi-turn Elo results');
    return ranked.map(r => {
      const score = r.multiturnElo!;
      if (![score, r.multiturnPm, r.multiturnVotes].every(Number.isFinite)) throw new Error('Invalid Elo result');
      const metrics: Record<string, number> = { votes: r.multiturnVotes };
      if (typeof r.costPer1m === 'number') metrics.costPer1m = r.costPer1m;
      if (typeof r.latencyMs === 'number') metrics.latencySeconds = r.latencyMs / 1000;
      if (typeof r.rubric === 'number' && Number.isFinite(r.rubric)) metrics.rubric = r.rubric;
      if (typeof r.engagement === 'number' && Number.isFinite(r.engagement)) metrics.engagement = r.engagement;
      if (typeof r.failureAvg === 'number' && Number.isFinite(r.failureAvg)) metrics.failureAvg = r.failureAvg;
      if (typeof r.compositeScore === 'number' && Number.isFinite(r.compositeScore)) metrics.compositeScore = r.compositeScore;
      return { model: r.name, score, low: score - r.multiturnPm, high: score + r.multiturnPm, open: r.access === 'open', metrics };
    });
  },
};

export default board;
