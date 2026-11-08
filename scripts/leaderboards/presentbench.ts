// PresentBench: the project table reports Total rubric score on a 0–100 percentage scale.
// Product identities, evaluation month and domain scores remain attached to each result.
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
  const v = (s ?? '').replace(/\\/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;

const FEED = "https://presentbench.github.io/";
const board: Leaderboard = {
  "benchmark": "presentbench",
  "url": "https://presentbench.github.io/",
  "feed": "https://presentbench.github.io/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    {
      const t = data.find(t => new RegExp("Method.*Total.*Academia", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("Method.*Total.*Academia", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[1]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = 'tested '+r[8];
        row.metrics = {};
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["academia"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["advertising"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["education"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["economics"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["talk"] = n; }
        rows.push(row);
      }
    }
    const dimensions = data.find(t => t[0]?.includes('Presentation Fundamentals'));
    for (const r of dimensions?.slice(1) ?? []) {
      const row = rows.find(x => x.model === r[0]);
      if (!row) continue;
      row.metrics ??= {};
      for (let i = 1; i <= 5; i++) { const n = numeric(r[i]); if (n !== undefined) row.metrics[dimensions![0][i]] = n; }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
