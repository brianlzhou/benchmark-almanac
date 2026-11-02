// ScienceVision (UniPat AI). The leaderboard on unipat.ai/blog/ScienceVision is drawn from
// /static/sciencevision/data/benchmark.js, a plain data script (`window.SV_BENCHMARK = {...}`): per model
// the mean answer_score (0 to 1, ineligible trials counted zero, mean of three runs) under three settings.
// The board ranks by the "cc-3d" setting (source access with code), the page's headline ("best mean answer
// score ... 3D"), so that mean is the score, in the record's 0-to-1 unit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const PAGE = 'https://unipat.ai/blog/ScienceVision';
const FEED = 'https://unipat.ai/static/sciencevision/data/benchmark.js';

interface Data {
  leaderboard: { models: { label: string; settings: Record<string, { mean?: number }> }[] };
}

const board: Leaderboard = {
  benchmark: 'sciencevision',
  url: `${PAGE}#leaderboard`,
  feed: `${FEED} (leaderboard.models, cc-3d mean)`,
  terms: 'Static data script on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  aliases: {
    'Hunyuan-4 Preview': 'tencent-hy4-preview',
  },
  async fetch() {
    const data = jsonAfter<Data>(await fetchText(FEED), 'window.SV_BENCHMARK =');
    const rows: LeaderboardRow[] = [];
    for (const m of data.leaderboard.models) {
      const score = m.settings['cc-3d']?.mean;
      if (typeof score === 'number') rows.push({ model: m.label, score });
    }
    if (!rows.length) throw new Error('no cc-3d scores in the ScienceVision data');
    return rows;
  },
};
export default board;
