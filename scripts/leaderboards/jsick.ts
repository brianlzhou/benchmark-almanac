// JSICK tests Japanese textual entailment and semantic similarity.
// The JMTEB task leaderboard reports its cosine Spearman score on the test split.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/JSICK/scores';
const board: Leaderboard = {
  benchmark: 'jsick', url: FEED, feed: FEED,
  terms: 'MTEB publishes these results under the CC0 1.0 license. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const data = await fetchJson<{ task: { name: string }; rows: Array<{ model: { name: string; activeParamsB?: number; totalParamsB?: number; openWeights?: boolean; license?: string }; score: number }> }>(FEED);
    if (data.task.name !== 'JSICK') throw new Error('MTEB task changed');
    const rows: LeaderboardRow[] = data.rows.filter((row) => typeof row.model?.name === 'string' && typeof row.score === 'number').map((row) => ({ model: row.model.name, score: row.score * 100, open: row.model.openWeights ?? undefined, license: row.model.license || undefined, params: row.model.totalParamsB && row.model.totalParamsB > 0 ? row.model.totalParamsB : undefined }));
    if (rows.length < 2) throw new Error('MTEB returned too few JSICK rows');
    return rows;
  },
};
export default board;
