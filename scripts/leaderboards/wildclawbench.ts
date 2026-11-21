// WildClawBench: Overall Score is the percentage on the full task suite. Total cost and time
// are divided by the live task-count table; the comparison table already gives per-task cost and minutes.
// Additional harness results remain separate from the OpenClaw leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/InternLM/WildClawBench/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "wildclawbench",
 url: "https://github.com/InternLM/WildClawBench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 stats: {
   minutes: { name: 'Total time per task', unit: 'minutes', better: 'lower' },
   minutesPerTask: { name: 'Average minutes per task', unit: 'minutes', better: 'lower' },
 },

 aliases: {'Muse Glimmer 30B':'muse-glimmer'},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const ts=markdownTables(await fetchText(FEED));
  const t=ts.find(t=>t[0].includes('Overall Score'));
  const tasks=ts.find(t=>t[0].includes('Category') && t[0].includes('#'));
  if(!t||!tasks) throw new Error('WildClawBench leaderboard or task counts missing');
  const count=tasks.slice(1).reduce((sum,r)=>sum+(num(r[1])??0),0);
  if(count<=0) throw new Error('WildClawBench task count missing');
  const rows:LeaderboardRow[]=t.slice(1).filter(r=>num(r[3])!==undefined).map(r=>({model:r[1],score:num(r[3])!,harness:'OpenClaw',
    cost:r[5]==='Free'?0:num(r[5])!==undefined?num(r[5])!/count:undefined,
    metrics:{minutes:num(r[4])!/count,minutesPerTask:num(r[4])!/count}}));
  const comparison=ts.find(t=>t[0].includes('Hermes Agent'));
  for(const r of comparison?.slice(2)??[]) for(const [index,harness] of [[4,'Claude Code'],[7,'Codex'],[10,'Hermes Agent']] as const){
    const score=num(r[index+2]);if(score===undefined)continue;
    rows.push({model:r[0],harness,score,cost:num(r[index+1]),metrics:{minutes:num(r[index])!,minutesPerTask:num(r[index])!}});
  }
  const page = await fetchText('https://internlm.github.io/WildClawBench/');
  const names = new Map([...page.matchAll(/\{id:\s*(\d+),\s*name:'([^']+)'/g)].map(m => [m[1], m[2]]));
  const byModel = new Map(rows.filter(r => r.harness === 'OpenClaw').map(r => [r.model.toLowerCase(), r]));
  board.parts = { mm: { name: 'Multimodal', group: 'Input' }, pt: { name: 'Pure text', group: 'Input' } };
  const splits = page.match(/const SPLIT_SCORES=\{([\s\S]*?)\n\};/)?.[1] ?? '';
  for (const match of splits.matchAll(/(\d+):\s*\{([^}]+)\}/g)) {
    const row = byModel.get(names.get(match[1])?.toLowerCase() ?? '');
    if (row) for (const cell of match[2].matchAll(/(\w+):\s*([\d.]+)/g)) (row.metrics ??= {})[cell[1]] = Number(cell[2]);
  }
  for (const category of page.matchAll(/id:'\d+', key:'([^']+)'[^}]*?name:'([^']+)'[^}]*?scores:\[([^\]]+)\]/g)) {
    const [, key, name, scores] = category;
    board.parts[key] = { name, group: 'Task category' };
    for (const cell of scores.matchAll(/modelId:(\d+),\s*rate:\s*([\d.]+),\s*elapsed:\s*([\d.]+),\s*cost:\s*([\d.]+|null)/g)) {
      const row = byModel.get(names.get(cell[1])?.toLowerCase() ?? '');
      if (!row) continue;
      const metrics = row.metrics ??= {};
      metrics[key] = Number(cell[2]);
      metrics[key + ':seconds'] = Number(cell[3]);
      if (cell[4] !== 'null') metrics[key + ':usd'] = Number(cell[4]);
    }
  }
  const repo = 'https://huggingface.co/datasets/internlm/WildClawBench-Trajectories';
  const files = await fetchJson<{path: string}[]>(repo.replace('/datasets/', '/api/datasets/') + '/tree/main/data');
  for (const f of files) {
    if (!/^data\/openclaw-[\w.-]+\.jsonl$/.test(f.path)) continue;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const url = repo + '/resolve/main/' + f.path;
    const body = await fetchText(url);
    const runs = body.trim().split('\n').map(line => JSON.parse(line) as {model: string; task_id: string; score: number; output_tokens?: number; steps?: number; tool_calls?: number});
    const row = byModel.get(runs[0]?.model.toLowerCase());
    if (!row || runs.some(r => r.model !== runs[0].model) || new Set(runs.map(r => r.task_id)).size !== count) continue;
    const metrics = row.metrics ??= {};
    for (const key of ['output_tokens', 'steps', 'tool_calls'] as const) {
      if (!runs.every(r => typeof r[key] === 'number')) continue;
      const avg = runs.reduce((sum, r) => sum + r[key]!, 0) / runs.length;
      if (key === 'output_tokens') row.tokens = avg;
      else metrics['mean:' + key] = avg;
    }
    row.link = url;
  }
  for (const r of rows) if (typeof r.metrics?.minutesPerTask === 'number') r.metrics.latency = r.metrics.minutesPerTask * 60;
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
