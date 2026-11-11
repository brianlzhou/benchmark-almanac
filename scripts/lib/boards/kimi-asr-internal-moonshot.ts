// Moonshot reports two named internal speech test subsets. Each child imports its whole-subset WER; the paper does not publish a combined denominator.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { text, tables } from '../html.ts';

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


const FEED = "https://raw.githubusercontent.com/MoonshotAI/Kimi-Audio-Evalkit/HEAD/LEADERBOARD.md";
const board: Leaderboard = {
  "benchmark": "kimi-asr-internal-moonshot",
  "url": "https://github.com/MoonshotAI/Kimi-Audio-Evalkit/blob/main/LEADERBOARD.md",
  "feed": "https://raw.githubusercontent.com/MoonshotAI/Kimi-Audio-Evalkit/HEAD/LEADERBOARD.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const t = tables(source).find(t => t.some(r => r.some(c => c.text.includes('Kimi-ASR Internal Testset'))));
    if (!t) throw new Error('ASR table missing');
    const rows: LeaderboardRow[] = []; let active = false;
    for (const r of t) {
      if (r.length === 3) active = r[0].text.includes('Kimi-ASR Internal Testset');
      if (!active) continue;
      const model = r[r.length-2].text;
      const values = r[r.length-1].text.split('|');
      for (const [i,v] of values.entries()) {const score = numeric(v); if (score !== undefined) rows.push({model:identity(model),score,setting:`subset${i+1}`});}
    }
    if (!rows.length) throw new Error('Internal test results missing');
    return rows;
  },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
