// Story Hacker scores fiction using readers’ votes and craft criteria. The leaderboard API supplies the combined score, costs and component ratings.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://bench.storyhacker.ai/api/leaderboard";

interface Entry {
  model: string; finished_at: string; overall_score: number; overall_provisional: boolean;
  writer_cost: number | null; completed_stories: number; ai_score: number; ai_low: number; ai_high: number;
  human_score: number; story_score: number; intelligence_score: number; prose_score: number;
  human: Record<string, number | boolean>; criteria: { criterion: string; score: number }[];
}

const board: Leaderboard = {
  benchmark: "fiction-bench-story-hacker",
  url: "https://bench.storyhacker.ai/",
  feed: FEED,
  terms: "The public leaderboard gives no explicit reuse license. https://bench.storyhacker.ai/ The robots URL returns the site HTML.",
  costPer: 'run',
  async fetch() {
    const data = await fetchJson<Entry[]>(FEED);
    if (data.length < 42) throw new Error('Expected at least 42 fiction results');
    const parts: Record<string, string> = { story: 'Story', intelligence: 'Intelligence', prose: 'Prose quality', human: 'Human rating', ai: 'AI score' };
    const rows = data.map((r) => {
      if (!r.model || !r.finished_at || !Number.isFinite(r.overall_score) || !r.criteria?.length) throw new Error('Incomplete fiction result');
      const metrics: Record<string, number> = { story: r.story_score, intelligence: r.intelligence_score,
        prose: r.prose_score, human: r.human_score, ai: r.ai_score, aiLow: r.ai_low, aiHigh: r.ai_high, stories: r.completed_stories };
      for (const c of r.criteria) { parts[c.criterion] = c.criterion; metrics[c.criterion] = c.score; }
      for (const [key, value] of Object.entries(r.human ?? {})) if (typeof value === 'number') metrics['human_' + key] = value;
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error(`Invalid metric for ${r.model}`);
      return { model: r.model, score: r.overall_score, cost: r.writer_cost ?? undefined,
        date: r.finished_at.slice(0, 10), setting: r.overall_provisional ? 'Provisional human rating' : undefined, metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
