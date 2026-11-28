// QuAC: the official table ranks dialogue QA systems by word-level F1 on the hidden test set.
// F1 is a percentage; human performance is excluded and HEQQ/HEQD remain metrics.
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

const FEED = "https://quac.ai/";
const board: Leaderboard = {
  "benchmark": "quac",
  "url": "https://quac.ai",
  "feed": "https://quac.ai/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  stats: {
    heqq: { name: 'Human equivalence question score', unit: '%', better: 'higher', note: 'Percentage of questions where the model meets or exceeds human F1.' },
    heqd: { name: 'Human equivalence dialogue score', unit: '%', better: 'higher', note: 'Percentage of dialogues where the model meets or exceeds human F1 on every question.' },
  },
  async fetch() {
    const source = await fetchText(FEED);
    const data = tables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data.find(t => new RegExp("Rank.*Model.*F1", "i").test((t[0] ?? []).map(c => c.text).join(" | ")));
      if (!t) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[2]?.text);
        let model = clean(r[1]?.text ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        if (!(!/^Human Performance/i.test(model))) continue;
        const href = r[1]?.html.match(/href="\s*(https?:\/\/[^"\s]+)\s*"/)?.[1]?.replace(/&amp;/g, '&');
        const row: LeaderboardRow = { model: identity(model), score: value * 1, ...(href ? { link: href } : {}) };
        row.setting = /ensemble|essemble/i.test(model) ? 'ensemble' : /single model/i.test(model) ? 'single model' : undefined;
        row.metrics = {};
        { const n = numeric(r[3]?.text); if (n !== undefined) row.metrics["heqq"] = n; }
        { const n = numeric(r[4]?.text); if (n !== undefined) row.metrics["heqd"] = n; }
        rows.push(row);
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
