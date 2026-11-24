// PlotPoints Round 1 ranks single-turn roleplay replies by blind-vote Elo. The public leaderboard API includes intervals and vote counts.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://plotlightstudios.com/api/plotpoints/leaderboard?round=1&test=elo";
interface Model {
  name: string;
  elo?: number;
  eloPm: number;
  arenaVotes: number;
  sfw: number;
  nsfw: number;
  access: string;
  latencyMs?: number;
  costPer1m?: number;
  multiturnElo?: number;
  rubric?: number;
  failureAvg?: number;
  engagement?: number;
  compositeScore?: number;
}

const board: Leaderboard = {
  benchmark: "plotpoints-round-1",
  url: "https://plotlightstudios.com/plotpoints/leaderboard?round=1&test=elo",
  feed,
  terms: "PlotPoints labels its public results CC BY 4.0. The repository and Hugging Face dataset list CC BY-NC 4.0. https://plotlightstudios.com/plotpoints https://huggingface.co/datasets/lazyweasel/roleplay-bench The site disallows /api/ in robots.txt.",
  stats: {
    votes: { name: 'Votes', unit: 'count' },
    sfw: { name: 'SFW win rate', unit: '%', better: 'higher' },
    nsfw: { name: 'NSFW win rate', unit: '%', better: 'higher' },
    latency: { name: 'Latency', unit: 'ms', better: 'lower' },
    costPer1m: { name: 'Blended price', unit: 'usd-per-mtok', better: 'lower' },
    multiturnElo: { name: 'Multi-turn Elo', unit: 'elo', better: 'higher' },
    rubric: { name: 'Rubric score', unit: 'score', better: 'higher', note: 'Mean LLM-judge rubric score across 11 axes on a 1 to 5 scale.' },
    failureAvg: { name: 'Mean failure score', unit: 'score', better: 'lower', note: 'Average failure score across adversarial multi-turn probes.' },
    engagement: { name: 'Engagement score', unit: 'score', better: 'higher', note: 'Judge engagement proxy on a 1 to 5 scale.' },
    compositeScore: { name: 'Composite score', unit: 'score', better: 'higher', note: 'Weighted composite score on a 0 to 100 scale.' },
  },
  async fetch(){
    const d=await fetchJson<{test:string;models:Model[]}>(feed);
    const ranked=d.models.filter(r=>typeof r.elo==='number');
    if(d.test!=='elo' || ranked.length<11) throw new Error('Missing single-turn Elo standings');
    return ranked.map(r=>{
      if(!r.name || ![r.elo,r.eloPm,r.arenaVotes].every(Number.isFinite)) throw new Error('Invalid arena result');
      const metrics: Record<string, number> = { votes: r.arenaVotes, sfw: r.sfw, nsfw: r.nsfw };
      if (Number.isFinite(r.latencyMs)) metrics.latency = r.latencyMs!;
      if (Number.isFinite(r.costPer1m)) metrics.costPer1m = r.costPer1m!;
      if (Number.isFinite(r.multiturnElo)) metrics.multiturnElo = r.multiturnElo!;
      if (Number.isFinite(r.rubric)) metrics.rubric = r.rubric!;
      if (Number.isFinite(r.failureAvg)) metrics.failureAvg = r.failureAvg!;
      if (Number.isFinite(r.engagement)) metrics.engagement = r.engagement!;
      if (Number.isFinite(r.compositeScore)) metrics.compositeScore = r.compositeScore!;
      return {model:r.name,score:r.elo!,low:r.elo!-r.eloPm,high:r.elo!+r.eloPm,open:r.access==='open',metrics};
    });
  },
};
export default board;
