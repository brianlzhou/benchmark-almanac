// RefAV's linked EvalAI spatiotemporal test board ranks participant submissions by HOTA-Temporal.
// The public leaderboard endpoint gives the metric order, all four scores and submission metadata.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://eval.ai/api/jobs/challenge_phase_split/6908/leaderboard/?page_size=1000&order_by=undefined';
interface Submission {
  submission__participant_team__team_name: string; submission__participant_team__team_url?: string; submission__method_name?: string;
  submission__submitted_at: string; submission__is_verified_by_host: boolean; submission__is_baseline: boolean;
  leaderboard__schema: { labels: string[]; default_order_by: string }; result: number[];
}
const board: Leaderboard = {
  benchmark: 'refav', url: 'https://eval.ai/web/challenges/challenge-page/2662/leaderboard/6908', feed,
  terms: 'EvalAI serves this public challenge leaderboard for the organizers.',
  harnesses: 'system', verified: 'Verified by the challenge organizers',
  stats: {
    hotaTrack: { name: 'Higher Order Tracking Accuracy track', unit: '%', better: 'higher' },
    timestampBA: { name: 'Timestamp boundary accuracy', unit: '%', better: 'higher' },
    logBA: { name: 'Log boundary accuracy', unit: '%', better: 'higher' },
    baseline: { name: 'Baseline flag', unit: 'count', note: '1 when EvalAI marks the submission as a baseline, 0 otherwise.' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    let next: string | null = feed;
    do {
      const page: { results: Submission[]; next: string | null; count: number } = await fetchJson(next);
      for (const r of page.results) {
        const { labels, default_order_by } = r.leaderboard__schema;
        if (labels.join('|') !== 'HOTA-Temporal|HOTA-Track|Timestamp BA|Log BA' || default_order_by !== labels[0] ||
          r.result.length !== 4 || !r.result.every(Number.isFinite)) throw new Error('RefAV metrics changed');
        const team = r.submission__participant_team__team_name, method = r.submission__method_name;
        const label = method ? `${team} (${method})` : team;
        const link = r.submission__participant_team__team_url && /^https?:\/\/\S+$/.test(r.submission__participant_team__team_url.trim()) ? r.submission__participant_team__team_url.trim() : undefined;
        rows.push({ model: label, harness: method || team, submitter: team, score: r.result[0], link,
          date: r.submission__submitted_at.slice(0,10), verified: r.submission__is_verified_by_host,
          metrics: { hotaTrack: r.result[1], timestampBA: r.result[2], logBA: r.result[3], baseline: Number(r.submission__is_baseline) } });
      }
      next = page.next;
      if (next && !next.startsWith(feed.split('?')[0] + '?')) throw new Error('Unexpected EvalAI page');
      if (next) await new Promise(resolve => setTimeout(resolve, 1000));
      else if (rows.length !== page.count || rows.length < 14) throw new Error('Incomplete RefAV results');
    } while (next);
    return rows;
  },
};
export default board;
