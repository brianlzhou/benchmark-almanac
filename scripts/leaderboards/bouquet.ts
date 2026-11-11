// BOUQuET official translation leaderboard. Score is chrF++, as specified by the registry.
// The page defines its overall table as `filtered.groupby(["system"])[metrics].mean()`.
// Keep that published mean chrF++ over ALL source and target languages, not individual directions.
// The other three published overall metrics remain secondary metrics.
// MetricX is lower-is-better. Composite and language identification scores are higher-is-better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
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


const FEED = "https://huggingface.co/api/spaces/facebook/bouquet";
const board: Leaderboard = {
  "benchmark": "bouquet",
  "url": "https://huggingface.co/spaces/facebook/bouquet",
  "feed": "https://huggingface.co/api/spaces/facebook/bouquet",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const index = await fetchJson<{siblings: {rfilename: string}[]}>(FEED);
    const files = index.siblings.map(f => f.rfilename).filter(f => /^data\/mt_benchmark\/[^/]+\/scores\.csv$/.test(f));
    if (!files.length) throw new Error('No model score files');
    const rows: LeaderboardRow[] = [];
    for (const file of files) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const data = parseCsv(await fetchText(`https://huggingface.co/spaces/facebook/bouquet/raw/main/${file.split('/').map(encodeURIComponent).join('/')}`));
      const label = file.split('/')[2];
      const [model, effort] = label.split('__reasoning_');
      const sums: Record<string, number[]> = {};
      for (const r of data) {
        const metrics: Record<string, number> = {};
        for (const key of ['chrfpp', 'metricx', 'glotlid_score', 'glotlid_x_metricx']) {
          const n = r[key]?.trim() ? Number(r[key]) : NaN;
          if (Number.isFinite(n)) {metrics[key] = n; (sums[key] ??= []).push(n);}
        }
        if (metrics.chrfpp === undefined) continue;

      }
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(sums)) metrics[k] = v.reduce((a,b)=>a+b,0)/v.length;
      if (metrics.chrfpp !== undefined) rows.push({model: identity(model), score: metrics.chrfpp, metrics, setting: effort ? `reasoning ${effort}` : undefined});
    }
    if (!rows.length) throw new Error('No scored translation rows');
    return rows;
  },
};
export default board;
