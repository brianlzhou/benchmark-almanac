// tau2-bench Verified: Average accuracy across Airline, Retail and Telecom is the headline percentage.
// Reasoning effort stays in setting. Price/performance totals remain metrics because the README does not
// define a per-task denominator; output-token totals must not be reported as output tokens per task.
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
  const v = (s ?? '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;

const FEED = "https://raw.githubusercontent.com/amazon-agi/tau2-bench-verified/main/README.md";
const board: Leaderboard = {
  "benchmark": "tau2-bench-verified",
  "url": "https://github.com/amazon-agi/tau2-bench-verified",
  "feed": "https://raw.githubusercontent.com/amazon-agi/tau2-bench-verified/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors.",
  "aliases": {
    "Gemini Pro 3": "gemini-3-pro"
  }
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data.find(t => new RegExp("Rank.*Model.*Airline", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("Rank.*Model.*Airline", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[5]);
        let model = clean(r[1] ?? "");
        model = model.replace(/\s*\(reasoning:[^)]*\)/, '').trim();
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = r[1].match(/reasoning:\s*([^)]*)/)?.[1];
        row.harness = "tau2-bench-verified; gpt-5.1 user simulator";
        row.metrics = {};
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["airline"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["retail"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["telecom"] = n; }
        rows.push(row);
      }
    }
    const prices = data.find(t => t[0]?.join('|').includes('Input Tokens'));
    for (const r of prices?.slice(1) ?? []) {
      const model = clean(r[1]).replace(/\s*\(reasoning:[^)]*\)/, '').trim();
      const setting = r[1].match(/reasoning:\s*([^)]*)/)?.[1];
      const row = rows.find(x => x.model === model && x.setting === setting);
      if (!row) continue;
      row.metrics ??= {};
      for (const [key, col] of [['reportedCost', 6], ['scorePerDollar', 7], ['inputTokensTotal', 3], ['outputTokensTotal', 4], ['tokensTotal', 5]] as const) {
        const value = parseFloat(r[col].replace(/[$,]/g, '')) * (/M$/.test(r[col]) ? 1e6 : 1);
        if (Number.isFinite(value)) row.metrics[key] = value;
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
