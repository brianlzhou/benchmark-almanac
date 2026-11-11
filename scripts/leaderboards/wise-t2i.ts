// WISE_Verified official results. Score is overall 0–1 performance, with six domain metrics.
// The source names the verified subset; chain-of-thought runs remain separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, tables } from '../lib/html.ts';

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

const FEED = "https://raw.githubusercontent.com/PKU-YuanGroup/WISE/main/leadboard.md";
const board: Leaderboard = {
  "benchmark": "wise-t2i",
  "url": "https://github.com/PKU-YuanGroup/WISE",
  "feed": FEED,
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data.find(t => new RegExp("CULTURE", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("CULTURE", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[2]);
        let model = clean(r[1] ?? "");
        model = model.replace(/ \(w\/ CoT\)$/, '');
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = 'WISE_Verified' + (/w\/ CoT/.test(r[1]) ? '; CoT' : '');
        row.metrics = {};
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["culture"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["time"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["space"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["biology"] = n; }
        { const n = numeric(r[7]); if (n !== undefined) row.metrics["physics"] = n; }
        { const n = numeric(r[8]); if (n !== undefined) row.metrics["chemistry"] = n; }
        rows.push(row);
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
