// Ego4D ranks state-change object detection by COCO average precision. The EvalAI split API reports AP, AP50 and AP75 as fractions.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Entry {
  submission__method_name: string; submission__participant_team__team_name: string; submission__submitted_at: string;
  submission__participant_team__team_url: string; submission__is_verified_by_host: boolean; result: number[];
  leaderboard__schema: {labels: string[]; default_order_by: string};
}

const FEED = "https://eval.ai/api/jobs/challenge_phase_split/3930/leaderboard/";
const board: Leaderboard = {
  benchmark: "ego4d-state-change-object-detection",
  url: "https://eval.ai/web/challenges/challenge-page/1632/leaderboard/3930",
  feed: FEED,
  terms: "EvalAI gives entry and award terms. Ego4D requires a separate agreement for its recordings and annotations. https://eval.ai/api/challenges/challenge/1632 EvalAI serves no robots rules for the leaderboard.",
  verified: 'verified by the challenge host on EvalAI',
  stats: { ap50: { name: 'Average precision at IoU 50', unit: '%', better: 'higher' }, ap75: { name: 'Average precision at IoU 75', unit: '%', better: 'higher' } },
  async fetch() {
    const data = await fetchJson<{count: number; results: Entry[]}>(FEED + '?page_size=500');
    if (data.count < 5 || data.count !== data.results.length) throw new Error('Incomplete Ego4D leaderboard');
    return data.results.map(e => {
      if (e.leaderboard__schema.default_order_by !== 'AP' || e.leaderboard__schema.labels.join('|') !== 'AP|AP50|AP75' ||
        e.result.length !== 3 || !e.result.every(Number.isFinite)) throw new Error('Unexpected Ego4D result');
      const [score, ap50, ap75] = e.result.map(v => v * 100);
      const submitter = e.submission__participant_team__team_name;
      return { model: e.submission__method_name.trim() || submitter, submitter, date: e.submission__submitted_at.slice(0, 10), score,
        verified: e.submission__is_verified_by_host, link: e.submission__participant_team__team_url || undefined, metrics: { ap50, ap75 } };
    });
  },
};
export default board;
