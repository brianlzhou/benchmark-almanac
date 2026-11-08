// ABC-Bench screening evasion. The score is the chart's accuracy in percent (0 to 100), as Meta prints it and as the
// Liquid Handling and Fragment Design importers record it.
// Refusal percentages remain metrics; results flagged unreliable by the publisher are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { text, tables, num, jsonAfter } from '../lib/html.ts';

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


const FEED = "https://securebio.org/benchmarks/details/?benchmark=abc-bench";
const board: Leaderboard = {
  "benchmark": "abc-bench-screening-evasion",
  "url": "https://securebio.org/benchmarks/details/?benchmark=abc-bench",
  "feed": "https://securebio.org/benchmarks/details/?benchmark=abc-bench",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const rows = new Map<string, LeaderboardRow>();
    for (const m of source.matchAll(/<script type="application\/json" class="plotly-spec"[^>]*>([\s\S]*?)<\/script>/g)) {
      if (!m[1].includes('Model performance on ABC-Bench (screening-evasion)')) continue;
      const spec = JSON.parse(m[1]);
      if (spec.layout?.title?.text !== 'Model performance on ABC-Bench (screening-evasion)') continue;
      for (const trace of spec.data) for (const h of trace.hovertext ?? []) {
        const lines = h.split(/<br>/i).map(text).map((s: string) => s.trim()).filter(Boolean);
        if (/Too many refusals/i.test(h)) continue;
        const score = h.match(/Accuracy:\s*([\d.]+)%/);
        if (!score || !lines[0]) continue;
        const name = lines[0].replace(/\s*\[[^\]]+\]$/, '');
        const setting = lines[0].match(/\[([^\]]+)\]$/)?.[1];
        const refusal = h.match(/Refusals:\s*([\d.]+)%/);
        rows.set(lines[0], {model: identity(name), score: Number(score[1]), setting,
          metrics: refusal ? {refusalPercent: Number(refusal[1])} : undefined});
      }
    }
    if (!rows.size) throw new Error('Screening-evasion results missing');
    return [...rows.values()];
  },
};
export default board;
