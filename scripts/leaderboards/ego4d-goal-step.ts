// Ego4D Goal-Step tests understanding procedures in first-person video. The official EvalAI board ranks step grounding.
// The score is test recall at one prediction with temporal IoU of 0.3. The second column uses IoU of 0.5.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
interface Entry {
  result: number[]; submission__method_name: string; submission__submitted_at: string;
  submission__participant_team__team_name: string; submission__is_verified_by_host: boolean;
  leaderboard__schema: { labels: string[]; default_order_by: string };
}
const feed = 'https://eval.ai/api/jobs/challenge_phase_split/5405/leaderboard/?page_size=100';
const board: Leaderboard = {
  benchmark: 'ego4d-goal-step', url: 'https://eval.ai/web/challenges/challenge-page/2188/leaderboard/5405', feed,
  terms: 'The Ego4D challenge terms apply. https://eval.ai/web/challenges/challenge-page/2188/overview',
  verified: 'verified by the EvalAI host',
  async fetch() {
    const data = await fetchJson<{ results: Entry[]; count: number; next: string | null }>(feed);
    if (data.next || data.results.length !== data.count) throw new Error('Incomplete grounding board');
    const rows = data.results.filter(e => e.submission__method_name.trim()).map(e => {
      const schema = e.leaderboard__schema;
      if (schema.labels.join('|') !== 'r@1, IoU=0.3|r@1, IoU=0.5' || schema.default_order_by !== schema.labels[0] ||
          e.result.length !== 2 || !e.result.every(Number.isFinite)) throw new Error('Grounding metric columns changed');
      return { model: e.submission__method_name, submitter: e.submission__participant_team__team_name,
        date: e.submission__submitted_at.slice(0, 10), verified: e.submission__is_verified_by_host,
        setting: 'Step grounding', score: e.result[0], metrics: { recall1IoU05: e.result[1] } };
    });
    return checked(rows, 3);
  },
};
export default board;
