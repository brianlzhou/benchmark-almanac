// RoboChallenge Table30 v2. Score is the official 0–100 partial-credit rubric score.
// Policy submission labels remain system identities; success percentages and submitted task counts remain metrics.
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


const FEED = "https://robochallenge.ai/api/v2/leaderboard/leaderboard_table30_v2.json";
const board: Leaderboard = {
  "benchmark": "robochallenge-table30-v2",
  "url": "https://robochallenge.ai/leaderboard",
  "feed": "https://robochallenge.ai/api/v2/leaderboard/leaderboard_table30_v2.json",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{display_name:string,user_name:string,score:number,success_ratio:number,task_count:number,is_multi_task_model:boolean,last_submit_time:string,task_results:{task_id:string,score:number,success_ratio:number}[]}[]>(FEED);
    return data.filter(r=>Number.isFinite(r.score)).map(r=>{
      const metrics: Record<string,number> = {successPercent:r.success_ratio*100,taskCount:r.task_count};
      for (const t of r.task_results ?? []) {if (Number.isFinite(t.score)) metrics[`task_${t.task_id}`]=t.score;}
      return {model:r.display_name || r.user_name,score:r.score,setting:r.is_multi_task_model ? 'multi-task policy':'single-task policies',date:r.last_submit_time?.slice(0,10),metrics};
    });
  },
};
export default board;
