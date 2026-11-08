// The current README reports complete Math accuracy and General executable rate. Visualization difficulty tiers have no combined score and are excluded.
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
  const v = (s ?? '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;

const FEED = "https://raw.githubusercontent.com/QwenLM/Qwen-Agent/main/benchmark/code_interpreter/README.md";
const board: Leaderboard = {
  "benchmark": "code-interpreter-benchmark",
  "url": "https://github.com/QwenLM/Qwen-Agent/tree/main/benchmark/code_interpreter",
  "feed": "https://raw.githubusercontent.com/QwenLM/Qwen-Agent/main/benchmark/code_interpreter/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    {
      const t = data[0];
      if (!t || !new RegExp("Version 20231206", "i").test(t.slice(0, 3).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(3)) {
        const value = numeric(r[1]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Math accuracy; version 20231206";
        row.metrics = {};
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["generalExecutableRate"] = n; }
        rows.push(row);
        if (row.setting === "Math accuracy; version 20231206" && row.metrics?.generalExecutableRate !== undefined) rows.push({...row, score: row.metrics.generalExecutableRate, setting: "General executable rate; version 20231206", metrics: undefined});
      }
    }
    {
      const t = data[0];
      if (!t || !new RegExp("Version 20231206", "i").test(t.slice(0, 3).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(3)) {
        const value = numeric(r[2]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Visualization-Hard accuracy; version 20231206";
        row.metrics = {};
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["generalExecutableRate"] = n; }
        rows.push(row);
        if (row.setting === "Math accuracy; version 20231206" && row.metrics?.generalExecutableRate !== undefined) rows.push({...row, score: row.metrics.generalExecutableRate, setting: "General executable rate; version 20231206", metrics: undefined});
      }
    }
    {
      const t = data[0];
      if (!t || !new RegExp("Version 20231206", "i").test(t.slice(0, 3).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(3)) {
        const value = numeric(r[3]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Visualization-Easy accuracy; version 20231206";
        row.metrics = {};
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["generalExecutableRate"] = n; }
        rows.push(row);
        if (row.setting === "Math accuracy; version 20231206" && row.metrics?.generalExecutableRate !== undefined) rows.push({...row, score: row.metrics.generalExecutableRate, setting: "General executable rate; version 20231206", metrics: undefined});
      }
    }
    {
      const t = data[1];
      if (!t || !new RegExp("Judger Model = Qwen-vl-plus", "i").test(t.slice(0, 3).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(3)) {
        const value = numeric(r[1]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Visualization-Hard accuracy; Qwen-vl-plus judge";
        rows.push(row);
        if (row.setting === "Math accuracy; version 20231206" && row.metrics?.generalExecutableRate !== undefined) rows.push({...row, score: row.metrics.generalExecutableRate, setting: "General executable rate; version 20231206", metrics: undefined});
      }
    }
    {
      const t = data[1];
      if (!t || !new RegExp("Judger Model = Qwen-vl-plus", "i").test(t.slice(0, 3).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(3)) {
        const value = numeric(r[2]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Visualization-Easy accuracy; Qwen-vl-plus judge";
        rows.push(row);
        if (row.setting === "Math accuracy; version 20231206" && row.metrics?.generalExecutableRate !== undefined) rows.push({...row, score: row.metrics.generalExecutableRate, setting: "General executable rate; version 20231206", metrics: undefined});
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
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
