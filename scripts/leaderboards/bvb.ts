// BVB official reconstruction score. Overall is the published score; cost is USD per scene.
// Retains reasoning effort, harness, task metrics, and average runtime in seconds.
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


const FEED = "https://yoloytang.me/BVB/data.js";
const board: Leaderboard = {
  "benchmark": "bvb",
  "url": "https://yoloytang.me/BVB/",
  "feed": "https://yoloytang.me/BVB/data.js",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors.",
  "chart": {
    "title": "BVB score versus cost per scene",
    "x": {
      "key": "cost",
      "label": "Cost per scene",
      "unit": "$",
      "better": "lower"
    },
    "y": {
      "key": "score",
      "label": "Overall score",
      "unit": "score",
      "better": "higher"
    }
  }
,
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const data = jsonAfter(source,'window.BVB_DATA =') as {name:string,overall:number,effort:string,harness:string,costUsd:number,runtimeMin:number,dualVqa:number,latentSim:number,layout:number,motion:number,tasks:Record<string,number>}[];
    if (!Array.isArray(data) || !data.length) throw new Error('BVB data missing');
    return data.filter(r=>Number.isFinite(r.overall)).map(r=>({model:identity(r.name),score:r.overall,setting:r.effort,harness:r.harness,cost:r.costUsd,metrics:{...r.tasks,dualVqa:r.dualVqa,latentSimilarity:r.latentSim,layout:r.layout,motion:r.motion,cost:r.costUsd,latency:r.runtimeMin*60}}));
  },
};
export default board;
