// PlotPoints Round 3 rates multi-turn roleplay models in two independent tracks. Its public JSON reports the current Elo, vote count and judge prior.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://plotlightstudios.com/api/plotpoints/leaderboard?round=3";
interface Entry { name:string; elo:number; eloPrior:number; deltaVsPrior:number; nVotes:number; judge:number }
interface Track { round:number; track:string; count:number; standings:Entry[] }

const board: Leaderboard = {
  benchmark: "plotpoints-round-3",
  url: "https://plotlightstudios.com/plotpoints/leaderboard?round=3",
  feed: FEED,
  terms: "PlotPoints labels its public results CC BY 4.0. The repository and Hugging Face dataset list CC BY-NC 4.0. https://plotlightstudios.com/plotpoints https://huggingface.co/datasets/lazyweasel/roleplay-bench The robots file disallows /api/.",
  stats: { votes: { name: 'Votes', unit: 'count' }, prior: { name: 'Prior Elo', unit: 'elo' }, deltaVsPrior: { name: 'Elo change from prior', unit: 'elo' }, judge: { name: 'Judge score', unit: 'score', better: 'higher' } },
  async fetch() {
    const rows = [];
    for (const track of ['standard','nsfw']) {
      if (rows.length) await new Promise(resolve => setTimeout(resolve,1000));
      const d = await fetchJson<Track>(FEED + (track === 'standard' ? '' : '&mode=nsfw_multiturn_arena'));
      if (d.round !== 3 || d.track !== track || d.count !== d.standings.length || d.count < (track === 'standard' ? 21 : 40)) throw new Error('Incomplete Round 3 track');
      for (const r of d.standings) {
        if (!r.name || !Number.isFinite(r.elo)) throw new Error('Missing PlotPoints rating');
        rows.push({ model: r.name, score: r.elo, setting: track, metrics: { votes: r.nVotes, prior: r.eloPrior, deltaVsPrior: r.deltaVsPrior, judge: r.judge } });
      }
    }
    return rows;
  },
};
export default board;
