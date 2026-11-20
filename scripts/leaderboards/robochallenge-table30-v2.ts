// RoboChallenge Table30 v2. Score is the official 0–100 partial-credit rubric score.
// Policy submission labels remain system identities; success percentages and submitted task counts remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
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
board.parts = {
  task_3232: { name: 'Tidy up the makeup table', group: 'Task type' },
  task_6dcb: { name: 'Fold the clothes', group: 'Task type' },
  task_e358: { name: 'Scoop with a small spoon', group: 'Task type' },
  task_3809: { name: 'Stamp positioning', group: 'Task type' },
  task_43ea: { name: 'Wipe the blackboard', group: 'Task type' },
  task_2b13: { name: 'Hold the tray with both hands', group: 'Task type' },
  task_6ab4: { name: 'Place objects into desk drawer', group: 'Task type' },
  task_2945: { name: 'Put in pen container', group: 'Task type' },
  task_44df: { name: 'Shred paper', group: 'Task type' },
  task_8fc9: { name: 'Stack bowls', group: 'Task type' },
  task_c6b3: { name: 'Tie a knot', group: 'Task type' },
  task_90e1: { name: 'Wipe the table', group: 'Task type' },
  task_f31b: { name: 'Lint roller remove dirt', group: 'Task type' },
  task_0965: { name: 'Put the shoes back', group: 'Task type' },
  task_bec8: { name: 'Press the button', group: 'Task type' },
  task_b2e8: { name: 'Sweep the trash', group: 'Task type' },
  task_f5b4: { name: 'Water the flowers', group: 'Task type' },
  task_9d9d: { name: 'Arrange flowers', group: 'Task type' },
  task_abc7: { name: 'Wrap with a soft cloth', group: 'Task type' },
  task_3624: { name: 'Hang the cup', group: 'Task type' },
  task_ae1f: { name: 'Put the books back', group: 'Task type' },
  task_d96c: { name: 'Turn on the light switch', group: 'Task type' },
  task_2acf: { name: 'Pick out the green blocks', group: 'Task type' },
  task_4bca: { name: 'Paint jam', group: 'Task type' },
  task_cb19: { name: 'Item classification', group: 'Task type' },
  task_bf87: { name: 'Arrange fruits', group: 'Task type' },
  task_fea0: { name: 'Put the pencil case into the schoolbag', group: 'Task type' },
  task_6ccd: { name: 'Pack the toothbrush holder', group: 'Task type' },
  task_1c7d: { name: 'Untie the shoelaces', group: 'Task type' },
  task_671c: { name: 'Pack the items', group: 'Task type' },
};
export default board;
