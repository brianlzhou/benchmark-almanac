// DeepResearch Bench II. The muset-ai/DeepResearch-Bench-Leaderboard Space keeps this board in
// data_drb2/leaderboard.csv in its own repository: per system total_score (0 to 100), its three parts
// (info recall, analysis, presentation), the blocked rate and the number of valid tasks. total_score is the
// score. Keep only the current GPT-5.5 evaluator, excluding the incompatible legacy judge.
// Nearly every row is a deep research product, not a model, so most stay unmatched; OpenAI's
// o3 deep research has a model record.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = 'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard/resolve/main/data_drb2/leaderboard.csv';

const board: Leaderboard = {
  benchmark: 'deepresearch-bench-ii',
  url: 'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard',
  feed: `${FEED} (current GPT-5.5 total_score)`,
  terms: 'CSV in the muset-ai/DeepResearch-Bench-Leaderboard Hugging Face Space, licensed Apache-2.0.',
  aliases: {
    'GPT-o3 Deep Research': 'deep-research',
  },
  fetch: () => fetchDRB2Rows(),
};
export async function fetchDRB2Rows(feed = FEED, evaluator = 'GPT-5.5 evaluator'): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(feed))) {
      const score = num(r.total_score);
      const metrics: Record<string, number> = {};
      for (const k of ['info_recall','analysis','presentation','blocked_rate','valid_tasks']) { const v=num(r[k]); if (v !== undefined) metrics[k]=v; }
      if (r.model && score !== undefined) rows.push({ model: r.model.trim(), score, setting: evaluator, metrics });
    }
    if (!rows.length) throw new Error('no DeepResearch Bench II rows');
    return rows;
}
export default board;
