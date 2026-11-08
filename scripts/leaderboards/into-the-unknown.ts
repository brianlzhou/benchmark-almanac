// Into the Unknown: strict paper pass rate, requiring every node in all three gates.
// Reads the current viewer data path, retaining almost-pass rate, node scores, median time, harness and effort.
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


const FEED = "https://prometheus-eval.github.io/into-the-unknown/viewer/app.js";
const board: Leaderboard = {
  "benchmark": "into-the-unknown",
  "url": "https://prometheus-eval.github.io/into-the-unknown/viewer/",
  "feed": "https://prometheus-eval.github.io/into-the-unknown/viewer/app.js",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const script=await fetchText(FEED);
    const path=script.match(/const DATA\s*=\s*`\$\{ROOT\}\/([^`]+)`/)?.[1];
    if(!path) throw new Error('Viewer data path missing');
    const data=await fetchJson<any>(new URL(`../${path}/index.json`,FEED).href);
    const n=data.papers.length; if(!n) throw new Error('No papers');
    return data.models.flatMap((model:any) => {
      const agent=data.leaderboard.agents.find((a:any)=>a.model===model.dir); if(!agent) return [];
      const count=(mode:string)=>data.leaderboard.submissions.filter((s:any)=>s.model===model.dir && ['G1','G2','G3'].every(k=>s[mode][k]===true)).length;
      const metrics:Record<string,number>={almostPass:100*count('almost')/n, integrity:agent.R_integrity, direction:agent.R_direction, papers:n};
      if(Number.isFinite(agent.median_hours)) metrics.medianHours=agent.median_hours;
      return [{model:model.label,score:100*count('strict')/n,harness:model.harness,setting:model.reasoning_effort,metrics}];
    });
  },
};
export default board;
