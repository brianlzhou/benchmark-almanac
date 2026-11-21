// Teaching Monster ranks instructional video generators. Competition 6 publishes its AI audit score and rubric in the public competition feed.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://teaching.monster/competitions/6/leaderboard";
interface Entry { model_name: string; competitor_display: string; ai_total_score: number;
  ai_accuracy: number; ai_logic: number; ai_adaptability: number; ai_engagement: number; ai_audited_count: number }

const board: Leaderboard = {
  benchmark: "teaching-monster-challenge",
  url: "https://teaching.monster/app/leaderboard/competition/6",
  feed: FEED,
  terms: "The authors do not specify separate terms for leaderboard scores on https://teaching.monster/app/leaderboard/competition/6",
  async fetch() {
    const data = await fetchJson<{ competition_id: number; primary_metric: string; rankings: Entry[] }>(FEED);
    if (data.competition_id !== 6 || data.primary_metric !== 'ai_total_score' || data.rankings.length < 2)
      throw new Error('Teaching Monster competition or ranking changed');
    return data.rankings.map(r => {
      const metrics = { accuracy: r.ai_accuracy, logic: r.ai_logic, adaptability: r.ai_adaptability,
        engagement: r.ai_engagement, audited: r.ai_audited_count };
      if (!r.model_name || ![r.ai_total_score, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Incomplete AI audit');
      return { model: r.model_name, score: r.ai_total_score, submitter: r.competitor_display, metrics };
    });
  },
};
export default board;
