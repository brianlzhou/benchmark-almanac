// TRLawBench opens on Stage 3, the latest stage and the default leaderboard view.
// Its published reasoning-quality score is on the registry's 0–10 score scale.
// Earlier stages use percentage accuracy and are excluded. Accuracy remains a metric.
// Keep at most 14 topic scores, without task-count rows or a new cross-stage average.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, jsonAfter } from '../lib/html.ts';

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
const identity = (name: string) => /^(?:gpt4o|gpt4|gpt4turbo|gpt4v|gpt35turbo|gemini(?:15|20|25)(?:pro|flash|flashlite|flashthinking)|claude35sonnet|deepseek(?:r1|v3))$/i.test(name.replace(/[- ._]/g, '')) ? `${name} (snapshot unspecified)` : name;


const FEED = "https://www.betaspacestudio.com/en/resources/trlawbench";
const board: Leaderboard = {
  "benchmark": "trlawbench",
  "url": "https://www.betaspacestudio.com/en/resources/trlawbench",
  "feed": "https://www.betaspacestudio.com/en/resources/trlawbench",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED); let payload = '';
    for (const m of source.matchAll(/self\.__next_f\.push\((\[.*?)\)<\/script>/g)) {
      const chunk = JSON.parse(m[1]); if (typeof chunk[1] === 'string') payload += chunk[1];
    }
    const benchmark = jsonAfter(payload,'"benchmark":') as {id:string,stages:{id:string,titleEn:string,models:{id:string,name:string,score:number,accuracy?:number,topicStats?:Record<string,{avgScore:number,tested:number,correct:number}>}[]}[]};
    if (benchmark.id !== 'trlawbench') throw new Error('Benchmark payload missing');
    const rows: LeaderboardRow[] = [];
    for (const stage of benchmark.stages.filter(s => s.id === 'stage-3')) for (const r of stage.models) {
      if (!Number.isFinite(r.score)) continue;
      const metrics: Record<string,number> = {};
      if (typeof r.accuracy === 'number') metrics.accuracyPercent=r.accuracy;
      for (const [topic,v] of Object.entries(r.topicStats ?? {}).slice(0, 14)) {metrics[topic]=v.avgScore;}
      const harness = /\+ YargıPro/.test(r.name) ? 'YargıPro' : /[·+] MCP/.test(r.name) ? 'MCP tools' : undefined;
      const name = r.name.replace(/\s*\+ YargıPro/,'').replace(/\s*[·+] MCP/,'');
      rows.push({model:identity(name),score:r.score,harness,metrics});
    }
    if (!rows.length) throw new Error('No stage scores');
    return rows;
  },
};
export default board;
