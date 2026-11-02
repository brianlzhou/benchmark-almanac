// DeepResearch Bench II. The muset-ai/DeepResearch-Bench-Leaderboard Space keeps this board in
// data_drb2/leaderboard.csv in its own repository: per system total_score (0 to 100), its three parts
// (info recall, analysis, presentation), the blocked rate and the number of valid tasks. total_score is the
// score. Nearly every row is a deep research product, not a model, so most stay unmatched; OpenAI's
// o3 deep research has a model record.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard/resolve/main/data_drb2/leaderboard.csv';

const board: Leaderboard = {
  benchmark: 'deepresearch-bench-ii',
  url: 'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard',
  feed: `${FEED} (total_score)`,
  terms: 'CSV file in the public muset-ai/DeepResearch-Bench-Leaderboard Space repository that the leaderboard reads; the Space states no other terms.',
  aliases: {
    'GPT-o3 Deep Research': 'deep-research',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = num(r.total_score);
      if (r.model && score !== undefined) rows.push({ model: r.model.trim(), score });
    }
    if (!rows.length) throw new Error('no DeepResearch Bench II rows');
    return rows;
  },
};
export default board;
