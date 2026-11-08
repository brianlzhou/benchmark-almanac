// RTEB beta: the published meanTask (nDCG@10), converted to percent, is the score.
// Require all benchmark tasks. Incomplete submissions never receive an overall row.
// Model embedding dimensions and prompt settings remain in the original configuration label.
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


const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/RTEB%28beta%29/scores";
const board: Leaderboard = {
  "benchmark": "rteb",
  "url": "https://huggingface.co/spaces/mteb/leaderboard",
  "feed": "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/RTEB%28beta%29/scores",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{benchmarkName:string,tasks:string[],rows:{model:{name:string},scoresByTask:Record<string,number|null>,meanTask:number|null}[]}>(FEED);
    if (data.benchmarkName !== 'RTEB(beta)' || !data.tasks.length) throw new Error('Unexpected RTEB response');
    const rows: LeaderboardRow[] = [];
    for (const r of data.rows) {
      const entries = data.tasks.flatMap(task => typeof r.scoresByTask[task] === 'number' && Number.isFinite(r.scoresByTask[task]) ? [[task,r.scoresByTask[task]] as const] : []);
      const metrics = {completedTasks:entries.length,totalTasks:data.tasks.length};

      if (entries.length === data.tasks.length && typeof r.meanTask === 'number' && Number.isFinite(r.meanTask)) rows.push({model:r.model.name,score:r.meanTask*100,setting:'RTEB beta; all tasks',metrics});
    }
    if (!rows.length) throw new Error('No RTEB task scores');
    return rows;
  },
};
export default board;
