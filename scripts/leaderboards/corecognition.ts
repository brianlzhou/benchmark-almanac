// CoreCognition mean accuracy in percent, with twelve cognitive dimensions and input conditions retained.
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

const FEED = "https://grow-ai-like-a-child.github.io/CoreCognition/leaderboard";
const board: Leaderboard = {
  "benchmark": "corecognition",
  "url": "https://grow-ai-like-a-child.github.io/CoreCognition/leaderboard",
  "feed": "https://grow-ai-like-a-child.github.io/CoreCognition/leaderboard",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    {
      const t = data[0];
      if (!t || !new RegExp("Mean", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[13]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Total: Image + Video";
        row.metrics = {};
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["boundary"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["continuity"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["permanence"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["spatiality"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["perceptualConstancy"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["intuitivePhysics"] = n; }
        { const n = numeric(r[7]); if (n !== undefined) row.metrics["perspective"] = n; }
        { const n = numeric(r[8]); if (n !== undefined) row.metrics["conservation"] = n; }
        { const n = numeric(r[9]); if (n !== undefined) row.metrics["hierarchy"] = n; }
        { const n = numeric(r[10]); if (n !== undefined) row.metrics["intentionality"] = n; }
        { const n = numeric(r[11]); if (n !== undefined) row.metrics["mechanicalReasoning"] = n; }
        { const n = numeric(r[12]); if (n !== undefined) row.metrics["toolUsing"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data[1];
      if (!t || !new RegExp("Mean", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[13]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Image only";
        row.metrics = {};
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["boundary"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["continuity"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["permanence"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["spatiality"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["perceptualConstancy"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["intuitivePhysics"] = n; }
        { const n = numeric(r[7]); if (n !== undefined) row.metrics["perspective"] = n; }
        { const n = numeric(r[8]); if (n !== undefined) row.metrics["conservation"] = n; }
        { const n = numeric(r[9]); if (n !== undefined) row.metrics["hierarchy"] = n; }
        { const n = numeric(r[10]); if (n !== undefined) row.metrics["intentionality"] = n; }
        { const n = numeric(r[11]); if (n !== undefined) row.metrics["mechanicalReasoning"] = n; }
        { const n = numeric(r[12]); if (n !== undefined) row.metrics["toolUsing"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data[2];
      if (!t || !new RegExp("Mean", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[13]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Single Image";
        row.metrics = {};
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["boundary"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["continuity"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["permanence"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["spatiality"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["perceptualConstancy"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["intuitivePhysics"] = n; }
        { const n = numeric(r[7]); if (n !== undefined) row.metrics["perspective"] = n; }
        { const n = numeric(r[8]); if (n !== undefined) row.metrics["conservation"] = n; }
        { const n = numeric(r[9]); if (n !== undefined) row.metrics["hierarchy"] = n; }
        { const n = numeric(r[10]); if (n !== undefined) row.metrics["intentionality"] = n; }
        { const n = numeric(r[11]); if (n !== undefined) row.metrics["mechanicalReasoning"] = n; }
        { const n = numeric(r[12]); if (n !== undefined) row.metrics["toolUsing"] = n; }
        rows.push(row);
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
