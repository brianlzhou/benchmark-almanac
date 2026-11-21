// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// Quesma measures what a trivial coding request costs with the Terminus agent. The report defines
// "total_cost = LLM API cost + user waiting cost" and prices waiting at the salary in its metadata.
// The report excludes errored runs from its per-prompt averages.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/QuesmaOrg/trival-prompt-bench/main/report.html';
const parts: Record<string,BoardPart> = {};
type Run = {model:string;total:number|null;n_runs:number;n_errors:number;llm:number;waiting:number;
  avg_latency:number;p95_latency:number;avg_tokens_out:number;reward:number|null;tool_calls:number|null};
const fields = { total:'Total cost', llm:'LLM API cost', waiting:'Waiting cost', avg_latency:'Average latency (seconds)',
  p95_latency:'95th percentile latency (seconds)', avg_tokens_out:'Output tokens per run', n_errors:'Errors',
  n_runs:'Runs',reward:'Reward',tool_calls:'Tool calls' } as const;
const board: Leaderboard = {
  benchmark:'trivial-prompt-bench',url:'https://github.com/QuesmaOrg/trival-prompt-bench/blob/main/report.html',feed,parts,
  aliases: {
    'openrouter/openai/gpt-5.4-mini': 'gpt-5-4-mini',
    'openrouter/google/gemini-3.5-flash': 'gemini-3-5-flash',
    'openrouter/anthropic/claude-haiku-4.5': 'claude-haiku-4-5',
    'openrouter/minimax/minimax-m3': 'minimax-m3',
    'openrouter/moonshotai/kimi-k2.6': 'kimi-k2-6',
    'openrouter/x-ai/grok-4.3': 'grok-4-3',
    'openrouter/openai/gpt-5.5': 'gpt-5-5',
    'openrouter/anthropic/claude-opus-4.8': 'claude-opus-4-8',
    'openrouter/deepseek/deepseek-v4-pro': 'deepseek-v4-pro',
    'openrouter/anthropic/claude-sonnet-5': 'claude-sonnet-5',
    'openrouter/z-ai/glm-5.2': 'glm-5-2',
    'openrouter/qwen/qwen3.7-max': 'qwen3-7-max',
    'openrouter/anthropic/claude-fable-5': 'claude-fable-5',
  },
  terms:'Quesma publishes this report on GitHub (https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).',
  headline:'The source gives no overall cost, so this is the plain mean of API and waiting cost per run across its four prompts.',
  async fetch() {
    const html = await fetchText(feed);
    const mark = html.match(/const DATA\s*=\s*/);
    if (!mark) throw new Error('Missing report data');
    const data = jsonAt<{tasks:{task:string;prompt:string;models:Run[]}[];meta:{annual_salary_usd:number;work_hours_per_year:number}}>(html,mark.index!+mark[0].length);
    if (data.tasks.length !== 4) throw new Error('Published task count changed');
    const models = new Map<string,{row:LeaderboardRow;costs:number[]}>();
    for (const t of data.tasks) {
      const key = t.task.split('/').pop()!.replace(/[^a-z0-9]/gi,'');
      for (const run of t.models) {
        if (run.total === null) continue;
        if (!Number.isFinite(run.total)) throw new Error('Missing total cost');
        const model = run.model;
        const entry = models.get(model) ?? {row:{model,harness:'Terminus',setting:'$'+data.meta.annual_salary_usd+' annual salary, '+data.meta.work_hours_per_year+' work hours per year',score:0,trials:0,metrics:{}},costs:[] as number[]};
        if (key+'total' in entry.row.metrics!) throw new Error('Duplicate task for ' + model);
        for (const f of Object.keys(fields) as (keyof typeof fields)[]) {
          const value = run[f];
          if (value === null) continue;
          if (!Number.isFinite(value)) throw new Error('Missing ' + f);
          const cost = ['total','llm','waiting'].includes(f);
          parts[key+f] = {name:fields[f],group:t.prompt,unit:cost?'usd':'score',better:f === 'reward'?'higher':'lower'};
          entry.row.metrics![key+f] = value;
        }
        entry.costs.push(run.total);
        entry.row.trials! += run.n_runs;
        models.set(model,entry);
      }
    }
    const rows = [...models.values()].filter(e=>e.costs.length===data.tasks.length).map(({row,costs}) =>
      ({...row,score:costs.reduce((a,b)=>a+b,0)/costs.length}));
    return checked(rows,12);
  },
};
export default board;
