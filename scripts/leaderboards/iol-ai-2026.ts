// The IOL-AI 2026 competition ranks team submissions by their combined exact-match and chrF score.
// The site's final standings use the final array in leaderboard.json and display scores out of 100.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://iolai.org/leaderboard.json';
interface Submission { team: string; score: number; exact_match: number; chrf: number; explanation_rate: number; datetime: string }
const board: Leaderboard = {
  benchmark: 'iol-ai-2026', url: 'https://iolai.org/#final-leaderboard', feed,
  stats: { exactMatch: { name: 'Exact match', unit: '%', better: 'higher' }, chrF: { name: 'Character F-score', unit: '%', better: 'higher' }, explanationRate: { name: 'Explanation rate', unit: '%', better: 'higher' } },
  terms: 'Public competition results from the organizers of IOL-AI 2026.',
  harnesses: 'system',
  async fetch() {
    const data = await fetchJson<{ final: Submission[] }>(feed);
    if (data.final.length < 48) throw new Error('Incomplete IOL-AI final standings');
    return data.final.map(r => {
      if (!r.team || ![r.score,r.exact_match,r.chrf,r.explanation_rate].every(Number.isFinite)) throw new Error('Incomplete IOL-AI submission');
      return { model: r.team, harness: r.team, submitter: r.team, date: r.datetime.slice(0,10), score: r.score * 100,
        metrics: { exactMatch: r.exact_match * 100, chrF: r.chrf * 100, explanationRate: r.explanation_rate } };
    });
  },
};
export default board;
