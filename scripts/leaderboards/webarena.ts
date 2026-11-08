// WebArena: the authors’ linked Google Sheet publishes Success Rate (%) for submitted systems.
// System names remain unlisted when no exact model is named; work and submission month are retained.
// Only run-configuration notes become settings, not citation links or publication comments.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://docs.google.com/spreadsheets/d/1M801lEpBbKSNwP-vDBkC_pF7LdyGU1f_ufZb_NWNBZQ/export?format=csv";
const board: Leaderboard = {
 benchmark: "webarena",
 url: "https://webarena.dev/og/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const rows=parseCsv(await fetchText(FEED)).filter(r=>r.Model && num(r['Success Rate (%)'])!==undefined && !/human/i.test(r.Model));
  return rows.map(r=>({model:r.Model.trim(),score:num(r['Success Rate (%)'])!,
    harness:r.Work && r.Work!==r.Model?r.Work:undefined,
    setting:/not achievable|different observation representation|Using both API and GUI|High-level plans are derived by human/.test(r.Note ?? '') ? r.Note.trim() : undefined,
    date:/^\d{2}\/\d{4}$/.test(r.a)?`${r.a.slice(3)}-${r.a.slice(0,2)}-01`:undefined}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
