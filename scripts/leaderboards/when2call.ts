// When2Call: F1 is the headline percentage in the official README.
// Open-model normalized accuracy and closed-model accuracy remain separate metrics and settings; BFCL is a different benchmark.
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
  const v = (s ?? '').replace(/\\/g, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;

const FEED = "https://raw.githubusercontent.com/NVIDIA/When2Call/main/README.md";
const board: Leaderboard = {
  "benchmark": "when2call",
  "url": "https://github.com/NVIDIA/When2Call",
  "feed": "https://raw.githubusercontent.com/NVIDIA/When2Call/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors.",
  "aliases": {
    "GPT-4-Turbo-04-09": "gpt-4-turbo-apr-2024",
    "Llama 3.2 1B Instruct": "llama-3-2-1b",
    "Llama 3.2 3B Instruct": "llama-3-2-3b",
    "Llama 3.1 8B Instruct": "llama-3-1-8b",
    "Llama 3.1 70B Instruct": "llama-3-1-70b",
    "Qwen 2.5 7B Instruct": "qwen2-5-7b",
    "Qwen 2.5 14B Instruct": "qwen2-5-14b",
    "Qwen 2.5 32B Instruct": "qwen2-5-32b",
    "Qwen 2.5 72B Instruct": "qwen2-5-72b"
  }
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data[0];
      if (!t || !new RegExp("Model.*F1", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[1]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "open models; normalized likelihood evaluation";
        row.metrics = {};
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["normalizedAccuracy"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["toolHallucination"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data[1];
      if (!t || !new RegExp("Model.*F1", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[1]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "closed models; generation evaluation";
        row.metrics = {};
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["accuracy"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["toolHallucination"] = n; }
        rows.push(row);
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
