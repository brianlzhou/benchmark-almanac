// VideoPhy: the headline is human joint semantic-adherence/physical-commonsense success.
// Automatic evaluator scores are secondary metrics on each matching human-evaluated model.
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

const FEED = "https://raw.githubusercontent.com/Hritikbansal/videophy/main/README.md";
const board: Leaderboard = {
  "benchmark": "videophy",
  "url": "https://github.com/Hritikbansal/videophy",
  "feed": "https://raw.githubusercontent.com/Hritikbansal/videophy/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data.find(t => new RegExp("Source.*SA=1, PC=1", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("Source.*SA=1, PC=1", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[3]);
        let model = clean(r[1] ?? "");
        model = model.replace(/[🥇🥈🥉]/gu, '').trim();
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };

        row.metrics = {};
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["semanticAdherence"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["physicalCommonsense"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data.find(t => new RegExp("PC=1.*SA=1.*Avg", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("PC=1.*SA=1.*Avg", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[4]);
        let model = clean(r[1] ?? "");
        model = model.replace(/[🥇🥈🥉]/gu, '').trim();
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row = rows.find(r => r.model === identity(model));
        if (!row) continue;
        row.metrics!.automaticMean = value;
        const pc = numeric(r[2]), sa = numeric(r[3]);
        if (pc !== undefined) row.metrics!.automaticPhysical = pc;
        if (sa !== undefined) row.metrics!.automaticSemantic = sa;
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
