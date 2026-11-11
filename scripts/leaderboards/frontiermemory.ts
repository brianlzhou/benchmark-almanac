// FrontierMemory 1.0: full-pass percentages from published chart labels.
// Rows identify the memory model; the task model and both efforts are explicit.
// Chart costs are estimated task-model USD per trial, excluding dreaming and trials without usage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
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


const FEED = "https://www.frontiermemory.com/blog/v1/";
const board: Leaderboard = {
  "benchmark": "frontiermemory",
  "url": "https://www.frontiermemory.com/blog/v1/",
  "feed": "https://www.frontiermemory.com/blog/v1/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors.",
  "chart": {
    "title": "Memory model performance versus task cost",
    "x": {
      "key": "cost",
      "label": "Mean estimated task-model cost per trial",
      "unit": "$",
      "better": "lower",
      "log": true
    },
    "y": {
      "key": "score",
      "label": "Full-pass rate",
      "unit": "%",
      "better": "higher"
    },
    "note": "Costs exclude dreaming and omit trials without usage. Rows distinguish memory models, task models, and effort."
  }
,
  async fetch(): Promise<LeaderboardRow[]> {

    const html=await fetchText(FEED); const rows:LeaderboardRow[]=[];
    const attr=(s:string,key:string)=>text(s.match(new RegExp(`${key}="([^"]*)"`))?.[1]??'');
    for(const m of html.matchAll(/<circle\b[^>]*\bdata-cost="[^>]+>/g)) {
      const label=attr(m[0],'aria-label'), memory=attr(m[0],'data-tip-mem'), task=attr(m[0],'data-tip-task');
      const values=label.match(/effort:\s*([\d.]+)%,\s*\$([\d.]+) per trial/);
      const pair=memory.match(/^(.*?) \(([^)]+)\)$/); if(!values || !pair || !task) throw new Error('Memory chart point changed');
      const cost=Number(values[2]);
      rows.push({model:pair[1],score:Number(values[1]),setting:`memory effort ${pair[2]}; task ${task}`,harness:'Letta Dream / Letta Code',cost,metrics:{cost}});
    }
    for(const m of html.matchAll(/<tr\b[^>]*class="harness-bar"[^>]*>/g)) {
      const memory=attr(m[0],'data-tip-mem'), task=attr(m[0],'data-tip-task'), summary=attr(m[0],'data-tip-sub');
      const pair=memory.match(/^(.*?) \(([^)]+)\) in (.+)$/), t=task.match(/^(.*?) in (.+)$/);
      const score=numeric(summary.split('%')[0]); if(!pair || !t || score===undefined) continue;
      if(pair[3]==='Letta Dream') continue; // Already represented by the corresponding chart point with cost.
      const sd=summary.match(/±([\d.]+) pp SD/);
      rows.push({model:pair[1],score,setting:`memory effort ${pair[2]}; task ${t[1]}`,harness:`${pair[3]} / ${t[2]}`,metrics:sd?{standardDeviation:Number(sd[1])}:undefined});
    }
    if(!rows.length) throw new Error('No FrontierMemory chart results');
    return rows;
  },
};
export default board;
