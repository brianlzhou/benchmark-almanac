// This board evaluates text-to-image models with subjective and objective image accuracy.
// The score is the board's combined accuracy value on the full text-to-image ranking.
// This importer reads the publisher's November 2026 ranking API and keeps both component accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const URL = 'https://agi-eval.org/topRanking?modality=MULTIMODAL_MODEL&modelType=TEXT_TO_IMAGE&rankType=PRIVATE';
const FEED = 'https://agi-eval.org/commWebApi/model/rank/dataList';
const board: Leaderboard = {
  benchmark: 'agi-eval-community-text-to-image', url: URL, feed: FEED,
  terms: 'The AGI-Eval publisher provides this ranking API publicly. Read the endpoint for attribution and reuse terms.',
  async fetch() {
    const body = { modality: 'MULTIMODAL_MODEL', modelType: 'TEXT_TO_IMAGE', rankType: 'PRIVATE', rankMonth: '2026/11', limit: 100 };
    const data = await fetchJson<{ rescode: number; data?: { modelRankList?: Array<{ name: string; projectList: Array<{ project: string; score: string }> }> } }>(FEED, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const list = data.data?.modelRankList;
    if (data.rescode !== 0 || !list) throw new Error('AGI-Eval ranking response changed');
    const rows: LeaderboardRow[] = [];
    for (const entry of list) {
      const subjective = entry.projectList.find(p => p.project === '主观准确率');
      const objective = entry.projectList.find(p => p.project === '客观准确率');
      const combined = entry.projectList.find(p => p.project === '综合准确率');
      if (!subjective || !objective || !combined) throw new Error(`Missing accuracy columns for ${entry.name}`);
      rows.push({ model: entry.name, score: Number(combined.score), metrics: { subjectiveAccuracy: Number(subjective.score), objectiveAccuracy: Number(objective.score) } });
    }
    if (rows.length < 2) throw new Error('AGI-Eval ranking has too few models');
    return rows;
  },
};
export default board;
