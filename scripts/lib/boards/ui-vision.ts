// UI-Vision has three distinct task families. Each uses its published headline metric; other metrics are auxiliary.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { text } from '../html.ts';

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
const identity = (name: string) => /^(?:gpt4o|gpt4|gpt4turbo|gpt4v|gpt35turbo|gemini(?:15|20|25)(?:pro|flash|flashlite|flashthinking)|claude35sonnet|deepseek(?:r1|v3))$/i.test(name.replace(/[- ._]/g, '')) ? `${name} (snapshot unspecified)` : name;

const FEED = "https://raw.githubusercontent.com/uivision/UI-Vision/main/README.md";
const board: Leaderboard = {
  "benchmark": "ui-vision",
  "url": "https://github.com/uivision/UI-Vision",
  "feed": "https://raw.githubusercontent.com/uivision/UI-Vision/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data.find(t => new RegExp("Final Avg", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("Final Avg", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[4]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Element grounding";
        row.metrics = {};
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["basic"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["functional"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["spatial"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data.find(t => new RegExp("IoU", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("IoU", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[1]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "Layout grounding; IoU";
        row.metrics = {};
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["precision"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["recall"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data.find(t => new RegExp("SSR", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("SSR", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[7]);
        let model = clean(r[0] ?? "");
        const textOnly=model.includes(' w/o image'); model=model.replace(' w/o image','');
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = 'Action prediction; step success'+(textOnly?'; text only':'');
        row.metrics = {};
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["clickMoveDistance"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["clickMoveRecall"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["dragDistance"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["dragRecall"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["typingCorrect"] = n; }
        { const n = numeric(r[6]); if (n !== undefined) row.metrics["hotkeyCorrect"] = n; }
        rows.push(row);
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
