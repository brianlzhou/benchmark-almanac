// Multilingual human evaluation: the Qwen2 release report publishes average human ratings across ten languages.
// Average is the headline score on the original rating scale, with language-specific ratings retained.
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
  const v = (s ?? '').replace(/\\/g, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;

const FEED = "https://qwenlm.github.io/blog/qwen2/";
const board: Leaderboard = {
  "benchmark": "multilingual-human-evaluation",
  "url": "https://qwenlm.github.io/blog/qwen2/",
  "feed": "https://qwenlm.github.io/blog/qwen2/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors.",
  "aliases": {
    "GPT-4o-0513": "gpt-4o-may-2024",
    "GPT-4-Turbo-0409": "gpt-4-turbo-apr-2024"
  }
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    {
      const t = data[12];
      if (!t || !new RegExp("Models.*Average", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[11]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.metrics = {};
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["ar"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["es"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["fr"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["ko"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["th"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["vi"] = n; }
        { const n = numeric(r[7]); if (n !== undefined) row.metrics["pt"] = n; }
        { const n = numeric(r[8]); if (n !== undefined) row.metrics["id"] = n; }
        { const n = numeric(r[9]); if (n !== undefined) row.metrics["ja"] = n; }
        { const n = numeric(r[10]); if (n !== undefined) row.metrics["ru"] = n; }
        rows.push(row);
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
