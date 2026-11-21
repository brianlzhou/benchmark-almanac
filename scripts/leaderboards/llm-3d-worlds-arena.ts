// LLM 3D Worlds Arena ranks model and renderer pairs by human preferences. The LLM track API supplies ratings and bootstrap intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://3d-arena-llm-3d-worlds-arena.hf.space/api/v2/leaderboard?track=llm";

interface Result { track: string; name: string; representation: string; system_id: string; access_class: string; license: string; score: number; confidence_95: number[]; votes: number; coverage: number; both_poor_rate: number }

const board: Leaderboard = {
  benchmark: "llm-3d-worlds-arena",
  url: "https://3d-arena-llm-3d-worlds-arena.hf.space/arena?view=leaderboard",
  feed: FEED,
  terms: "The protocol publishes aggregate ratings and lists component licenses by system. It gives no separate ratings license. https://huggingface.co/spaces/3d-arena/llm-3d-worlds-arena/blob/main/docs/3D-WORLD-ARENA.md",
  async fetch() {
    const data = await fetchJson<{track: string; rows: Result[]}>(FEED);
    if (data.track !== 'llm' || data.rows.length < 24) throw new Error('Incomplete LLM arena track');
    return data.rows.map((r): LeaderboardRow => {
      const [model, harness] = r.name.split(' + ');
      if (!harness || r.track !== 'llm' || r.confidence_95.length !== 2 || ![r.score,...r.confidence_95,r.votes,r.coverage,r.both_poor_rate].every(Number.isFinite)) throw new Error('Invalid arena result: ' + r.name);
      return { model, harness, setting: r.representation, score: r.score, low: r.confidence_95[0], high: r.confidence_95[1], license: r.license, open: r.access_class === 'open_source_or_open_weights',
        link: 'https://3d-arena-llm-3d-worlds-arena.hf.space/arena?track=llm&model='+encodeURIComponent(r.system_id),
        metrics: {votes: r.votes, coverage: r.coverage, bothPoorRate: r.both_poor_rate} };
    });
  },
};
export default board;
