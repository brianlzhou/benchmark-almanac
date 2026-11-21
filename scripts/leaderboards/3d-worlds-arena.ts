// 3D Worlds Arena ranks generated scenes from pairwise votes. Its generative leaderboard endpoint publishes the unfiltered ratings and 95% bootstrap intervals.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://3d-arena-3d-world-arena.hf.space/arena?view=leaderboard";
const feed = "https://3d-arena-3d-world-arena.hf.space/api/v2/leaderboard?track=generative";

const board: Leaderboard = {
  benchmark: '3d-worlds-arena', url, feed,
  terms: "The protocol publishes aggregate ratings and lists component licenses by system. It gives no separate ratings license. https://huggingface.co/spaces/3d-arena/3d-world-arena/blob/main/docs/3D-WORLD-ARENA.md" ,
  async fetch() {
    type Entry = {name: string; score: number; confidence_95: number[]; votes: number; coverage: number; both_poor_rate: number;
      representation: string; access_class: string; license: string};
    const data = await fetchJson<{track: string; rows: Entry[]; updated_at: number}>(feed);
    if (data.track !== 'generative' || data.rows.length < 3) throw new Error('Incomplete generative leaderboard');
    return data.rows.map(r => {
      const [low,high] = r.confidence_95;
      if (!r.name || !r.representation || ![r.score,low,high,r.votes,r.coverage,r.both_poor_rate].every(Number.isFinite)) throw new Error('Invalid rating');
      return {model:r.name, score:r.score, low, high, setting:r.representation, open:r.access_class === 'open_source_or_open_weights',
        license:r.license, date:new Date(data.updated_at*1000).toISOString().slice(0,10),
        metrics:{votes:r.votes, coverage:r.coverage, bothPoorRate:r.both_poor_rate} };
    });
  },
};
export default board;
