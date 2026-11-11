// BEHAVIOR Challenge 2026: Q-score converted from fraction to percent, with success percentage.
// Team and method identify robot systems that may have no foundation-model registry entry.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://huggingface.co/spaces/behavior-1k/2026-challenge-leaderboard/resolve/main/data/results.jsonl";
const board: Leaderboard = {
  "benchmark": "behavior-challenge-2026",
  "url": "https://huggingface.co/spaces/behavior-1k/2026-challenge-leaderboard",
  "feed": "https://huggingface.co/spaces/behavior-1k/2026-challenge-leaderboard/resolve/main/data/results.jsonl",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    return (await fetchText(FEED)).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)).filter(r=>Number.isFinite(r.q_score)).map(r=>{
      const d=r.submission_id?.match(/^(\d{4})(\d{2})(\d{2})/);
      return {model:`${r.team}: ${r.method}`,score:r.q_score*100,date:d?`${d[1]}-${d[2]}-${d[3]}`:undefined,setting:r.verified?'Verified submission':'Unverified submission',metrics:{successRate:r.success_rate*100}};
    });
  },
};
export default board;
