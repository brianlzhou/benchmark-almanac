// SArena-Icon: image-to-SVG reconstruction uses DINO similarity (higher is better) as the score.
// SSIM, LPIPS, PSNR and the text-to-SVG metrics remain supporting measurements.
// Models with no image-to-SVG result are not given a fabricated reconstruction score.
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
const identity = (name: string) => /^(?:gpt4o|gpt4|gpt4turbo|gpt4v|gpt35turbo|gemini(?:15|20|25)(?:pro|flash|flashlite|flashthinking)|claude35sonnet|deepseek(?:r1|v3))$/i.test(name.replace(/[- ._]/g, '')) ? `${name} (snapshot unspecified)` : name;

const FEED = "https://hmwang2002.github.io/release/internsvg/";
const board: Leaderboard = {
  "benchmark": "sarena",
  "url": "https://hmwang2002.github.io/release/internsvg/",
  "feed": "https://hmwang2002.github.io/release/internsvg/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    {
      const t = data[0];
      if (!t || !new RegExp("Model.*Image-to-SVG", "i").test(t.slice(0, 2).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(2)) {
        const value = numeric(r[6]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "SArena-Icon; image-to-SVG DINO";
        row.metrics = {};
        const tokenCount = (s: string) => { const m = s?.match(/^([\d.]+)(k)?$/); return m ? Number(m[1]) * (m[2] ? 1000 : 1) : undefined; };
        row.tokens = tokenCount(r[10]);
        const textTokens = tokenCount(r[5]); if (textTokens !== undefined) row.metrics.textTokens = textTokens;
        { const n = numeric(r[7]); if (n !== undefined) row.metrics["ssim"] = n; }
        { const n = numeric(r[8]); if (n !== undefined) row.metrics["lpips"] = n; }
        { const n = numeric(r[9]); if (n !== undefined) row.metrics["psnr"] = n; }
        { const n = numeric(r[1]); if (n !== undefined) row.metrics["textFid"] = n; }
        { const n = numeric(r[2]); if (n !== undefined) row.metrics["textFidC"] = n; }
        { const n = numeric(r[3]); if (n !== undefined) row.metrics["textClipT2I"] = n; }
        { const n = numeric(r[4]); if (n !== undefined) row.metrics["textClipI2I"] = n; }
        rows.push(row);
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
