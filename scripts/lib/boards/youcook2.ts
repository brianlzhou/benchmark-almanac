// YouCook2 dense video description requires both temporal segments and captions. Read its CIDEr score. Captioning micro/macro protocols have no default and are excluded.
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

const FEED = "https://raw.githubusercontent.com/LuoweiZhou/YouCook2-Leaderboard/master/README.md";
const board: Leaderboard = {
  "benchmark": "youcook2",
  "url": "https://github.com/LuoweiZhou/YouCook2-Leaderboard",
  "feed": "https://raw.githubusercontent.com/LuoweiZhou/YouCook2-Leaderboard/master/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data[1];
      if (!t || !new RegExp("Methods.*C", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[5]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "micro-level captioning";
        row.metrics = {};
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["bleu3"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["bleu4"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["meteor"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data[2];
      if (!t || !new RegExp("Methods.*C", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[5]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "macro-level captioning";
        row.metrics = {};
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["bleu3"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["bleu4"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["meteor"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data[3];
      if (!t || !new RegExp("Methods.*C", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[4]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "paragraph-level captioning";
        row.metrics = {};
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["bleu4"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["meteor"] = n; }
        { const n = numeric(r[5]); if (n !== undefined) row.metrics["repetition4"] = n; }
        rows.push(row);
      }
    }
    {
      const t = data[4];
      if (!t || !new RegExp("Methods.*C", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[4]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "dense video description";
        row.metrics = {};
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["bleu3"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["bleu4"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["meteor"] = n; }
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
