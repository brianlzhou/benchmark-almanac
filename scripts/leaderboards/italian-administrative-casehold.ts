// Italian-Administrative-CaseHold tests whether an encoder retrieves the correct Italian legal holding.
// The MTEB task leaderboard reports classification accuracy on the test split.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/ItaCaseholdClassification/scores';

const board: Leaderboard = {
  benchmark: 'italian-administrative-casehold',
  url: FEED,
  feed: FEED,
  terms: 'MTEB publishes these results under the CC0 1.0 license. https://huggingface.co/datasets/mteb/results',
  parts: { default: { name: 'Italian-Administrative-CaseHold', group: 'Task' } },
  async fetch() {
    const data = await fetchJson<{ task: { name: string }; rows: Array<{ model: { name: string }; score: number; subsetScores?: Record<string, Record<string, number>> }> }>(FEED);
    if (data.task.name !== 'ItaCaseholdClassification') throw new Error('MTEB task changed');
    const rows: LeaderboardRow[] = data.rows
      .filter((row) => typeof row.model?.name === 'string' && typeof row.score === 'number')
      .map((row) => ({ model: row.model.name, score: row.score * 100 }));
    if (rows.length < 2) throw new Error('MTEB returned too few ItaCaseholdClassification rows');
    return rows;
  },
};

export default board;
