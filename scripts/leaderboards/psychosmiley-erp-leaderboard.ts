// PsychoSmiley ranks models by points earned on yes/no questions and open-ended roleplay.
// The page loads total points and both component scores from results.json.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://psychosmiley.github.io/RP-Leaderboard/results.json";
const board: Leaderboard = {
  benchmark: "psychosmiley-erp-leaderboard",
  url: "https://psychosmiley.github.io/RP-Leaderboard/",
  feed,
  terms: "The repository uses the MIT license. The site returned 404 for robots.txt.",
  parts: { yesNo: 'Yes/No', openEnded: 'Open-ended' },
  aliases: { 'grok-4.1-fast:free': 'grok-4-1-fast', 'nemotron-3-ultra-550b-a55b:free': 'nemotron-3-ultra' },
  async fetch() {
    type Result = { display_name: string; total_score: number; max_score: number; yes_no_score: number; open_ended_score: number; timestamp: string };
    const { metadata, leaderboard } = await fetchJson<{ metadata: { total_models: number }; leaderboard: Result[] }>(feed);
    if (leaderboard.length < 6 || leaderboard.length !== metadata.total_models) throw new Error('Incomplete roleplay leaderboard');
    return leaderboard.map(r => {
      if (!r.display_name || ![r.total_score, r.yes_no_score, r.open_ended_score].every(Number.isFinite) || r.max_score !== 325) throw new Error('Invalid roleplay result');
      return { model: r.display_name, score: r.total_score, date: r.timestamp.slice(0, 10),
        metrics: { yesNo: r.yes_no_score, openEnded: r.open_ended_score } };
    });
  },
};
export default board;
