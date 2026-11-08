// BEHAVIOR-1K: the current 2026 challenge’s Q-score, its ranked whole-challenge progress metric.
// Q-score fractions become percentages. Success rate remains a metric. Method names stay unlisted when no base model is identified.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/behavior-1k/2026-challenge-leaderboard/raw/main/data/results.jsonl";
const board: Leaderboard = {
  benchmark: "behavior-1k",
  url: "https://huggingface.co/spaces/behavior-1k/2026-challenge-leaderboard/raw/main/data/results.jsonl",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const data=(await fetchText(FEED)).trim().split('\n').map(s=>JSON.parse(s));
    return data.map(r=>({model:r.method,score:r.q_score*100,setting:r.verified?'verified':'self-reported',metrics:{successRate:r.success_rate*100}}));
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
