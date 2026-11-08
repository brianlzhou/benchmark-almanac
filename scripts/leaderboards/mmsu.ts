// MMSU: the official README reports Avg (All) accuracy as the headline percentage.
// Perception and reasoning task scores remain metrics; the size column remains a configuration label.
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
  const v = (s ?? '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt4o|gpt4|gpt4turbo|gpt4v|gpt35turbo|gemini(?:15|20|25)(?:pro|flash|flashlite|flashthinking)|claude35sonnet|deepseek(?:r1|v3))$/i.test(name.replace(/[- ._]/g, '')) ? `${name} (snapshot unspecified)` : name;

const FEED = "https://raw.githubusercontent.com/dingdongwang/MMSU/main/README.md";
const board: Leaderboard = {
  "benchmark": "mmsu",
  "url": "https://github.com/dingdongwang/MMSU",
  "feed": "https://raw.githubusercontent.com/dingdongwang/MMSU/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data.find(t => new RegExp("Models.*Size.*Avg", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("Models.*Size.*Avg", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[2]);
        let model = clean(r[0] ?? "");
        model = model.replace(/[🏅🥈🥉]/gu, '').trim();
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = r[1] !== '-' ? r[1] : undefined;
        row.metrics = {};
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["perceptionSemantics"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["perceptionPhonology"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["perceptionParalinguistics"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["perception"] = n; }
        { const n = numeric(r[7]); if (n !== undefined) row.metrics["reasoningSemantics"] = n; }
        { const n = numeric(r[8]); if (n !== undefined) row.metrics["reasoningPhonology"] = n; }
        { const n = numeric(r[9]); if (n !== undefined) row.metrics["reasoningParalinguistics"] = n; }
        { const n = numeric(r[10]); if (n !== undefined) row.metrics["reasoning"] = n; }
        rows.push(row);
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
