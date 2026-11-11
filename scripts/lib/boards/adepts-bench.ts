// ADeptS publishes safety score S separately on 358 Mobile and 501 Desktop tasks. Each child uses its published S, with other measures as metrics.
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


const FEED = "https://raw.githubusercontent.com/facebookresearch/adepts/main/README.md";
const board: Leaderboard = {
  "benchmark": "adepts-bench",
  "url": "https://github.com/facebookresearch/adepts",
  "feed": "https://raw.githubusercontent.com/facebookresearch/adepts/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const data = markdownTables(await fetchText(FEED));
    const safety = data.find(t => t[0].includes('Mobile S↑'));
    const disambiguation = data.find(t => t[0].includes('Mobile F1↑'));
    if (!safety || !disambiguation) throw new Error('ADeptS results tables missing');
    const names: Record<string,string> = {'Claude 4.7 Opus':'claude-opus-4-7','Gemini 2.5 CU':'gemini-2.5-computer-use-preview-10-2025','Gemini 3.1 Pro':'gemini-3.1-pro-preview','Qwen3-VL-235B':'Qwen3-VL-235B-A22B-Instruct','Qwen3-VL-8B':'Qwen3-VL-8B-Instruct','Qwen3-VL-4B':'Qwen3-VL-4B-Instruct'};
    const rows: LeaderboardRow[] = [];
    for (const r of safety.slice(1)) for (const [platform, offset, dOffset] of [['Mobile',0,0],['Desktop',4,2]] as const) {
      const score = numeric(r[4+offset]); if (score === undefined) continue;
      const metrics: Record<string,number> = {};
      for (const [key,col] of [['taskSuccess',1],['attackSuccess',2],['falseRefusal',3]] as const) {
        const n = numeric(r[col+offset]); if (n !== undefined) metrics[key] = n;
      }
      const d = disambiguation.find(d => d[0] === r[0]);
      if (d) {const f = numeric(d[1+dOffset]); const e = numeric(d[2+dOffset]);
        if (f !== undefined) metrics.disambiguationF1 = f;
        if (e !== undefined && !(r[0] === 'Qwen3-VL-8B' && platform === 'Desktop')) metrics.severityError = e;
      }
      rows.push({model:names[r[0]] ?? identity(r[0]),score,setting:platform,metrics});
    }
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
