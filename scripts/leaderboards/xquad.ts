// XQuAD: the official README reports average F1 and exact match across languages.
// Average F1 is the headline score; translation baselines retain their distinct method identities.
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
  const v = (s ?? '').replace(/\\/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;

const FEED = "https://raw.githubusercontent.com/google-deepmind/xquad/master/README.md";
const board: Leaderboard = {
  "benchmark": "xquad",
  "url": "https://github.com/google-deepmind/xquad",
  "feed": "https://raw.githubusercontent.com/google-deepmind/xquad/master/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data[1];
      if (!t || !new RegExp("Model.*avg", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[13]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.metrics = {};
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["en"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["ar"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["de"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["el"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["es"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["hi"] = n; }
        { const n = numeric(r[7]); if (n !== undefined) row.metrics["ru"] = n; }
        { const n = numeric(r[8]); if (n !== undefined) row.metrics["th"] = n; }
        { const n = numeric(r[9]); if (n !== undefined) row.metrics["tr"] = n; }
        { const n = numeric(r[10]); if (n !== undefined) row.metrics["vi"] = n; }
        { const n = numeric(r[11]); if (n !== undefined) row.metrics["zh"] = n; }
        { const n = numeric(r[12]); if (n !== undefined) row.metrics["ro"] = n; }
        rows.push(row);
      }
    }
    const em = data[2];
    for (const r of em?.slice(1) ?? []) {
      const row = rows.find(x => x.model === r[0]), exactMatch = numeric(r[13]);
      if (row && exactMatch !== undefined) row.metrics = { ...row.metrics, exactMatch };
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
