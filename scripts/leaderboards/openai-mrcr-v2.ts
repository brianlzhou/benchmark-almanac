// OpenAI MRCR v2 (8-needle) on Context Arena. The feed is Context Arena's independently run full
// leaderboard. `overall_score` is the mean string-similarity score across all context bins and samples.
// The catalog reports context-bin values from model reports, so this importer uses the board's whole-run
// aggregate and records the 8-needle/all-bins protocol in each row's setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

type Entry = {
  model_slug: string;
  reasoning_mode?: string;
  overall_score: number;
  total_samples?: number;
};

const FEED = 'https://contextarena.ai/api/leaderboard?needles=8&mode=full';

const board: Leaderboard = {
  benchmark: 'openai-mrcr-v2',
  url: 'https://contextarena.ai/?needles=8&mode=full&showExtra=true',
  feed: FEED,
  terms: 'Context Arena publishes this independently run leaderboard and its API feed. The almanac credits and links Context Arena; its source terms and attribution requirements apply.',
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ needles: number; mode: string; leaderboard: Entry[] }>(FEED);
    if (data.needles !== 8 || data.mode !== 'full') throw new Error('Context Arena MRCR feed is not the 8-needle full board');
    const rows = data.leaderboard.map((r) => ({
      model: r.model_slug,
      score: r.overall_score * 100,
      setting: `8-needle, all context bins${r.reasoning_mode ? `, ${r.reasoning_mode} reasoning` : ''}`.toLowerCase(),
      metrics: r.total_samples === undefined ? undefined : { samples: r.total_samples },
    }));
    if (!rows.length) throw new Error('Context Arena MRCR feed returned no rows');
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score) || r.score < 0 || r.score > 100) throw new Error('Invalid Context Arena MRCR row');
    }
    return rows;
  },
};
export default board;
