// DeepResearchEval: published average report-quality score for the latest release, v2.
// Research products retain agent identities; factuality counts and percentages remain supporting metrics.
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


const FEED = "https://infinity-ailab.github.io/deep_research_eval/";
const board: Leaderboard = {
  "benchmark": "deepresearcheval-1",
  "url": "https://infinity-ailab.github.io/deep_research_eval/",
  "feed": "https://infinity-ailab.github.io/deep_research_eval/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const data = tables(await fetchText(FEED)).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for (const [qualityIndex, factualIndex, version] of [[0,1,'v1']] as const) {
      const quality = data[qualityIndex], factual = data[factualIndex];
      if (quality?.[0]?.[1] !== 'Avg' || factual?.[0]?.[1] !== 'Statements') throw new Error('Research tables changed');
      for (const r of quality.slice(1)) {
        const score = numeric(r[1]); if (score === undefined) continue;
        const metrics: Record<string,number> = {};
        for (const [i,key] of ['coverage','insight','instruction','clarity','task'].entries()) { const n = numeric(r[i+2]); if(n !== undefined) metrics[key]=n; }
        const f = factual.find(f => f[0] === r[0]);
        if (f) for (const [i,key] of ['statements','right','wrong','unknown','factualityPercent'].entries()) { const n = numeric(f[i+1]); if(n !== undefined) metrics[key]=n; }
        rows.push({model: `${r[0]} research agent`, score, setting: version, metrics});
      }
    }
    return rows;
  },
};
export default board;
