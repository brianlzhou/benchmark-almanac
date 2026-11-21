// MLRC-Bench evaluates research agents on seven competitions. The default ranking averages the percentage of the gap to the best human that each agent closes.
// The Space also offers absolute improvement over baseline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/launch/MLRC_Bench/resolve/main/src/data/metrics/relative_improvement_to_human.json";

const tasks = {perception_temporal_action_loc:'Temporal Action Localisation','llm-merging':'LLM Merging','meta-learning':'Meta Learning','product-recommendation':'Next Product Recommendation',weather_forcast:'Rainfall Prediction',machine_unlearning:'Machine Unlearning','backdoor-trigger-recovery':'Backdoor Trigger Recovery'};
type Results = Record<string,Record<string,number>>;

const board: Leaderboard = {
  benchmark: "mlrc-bench",
  url: "https://huggingface.co/spaces/launch/MLRC_Bench",
  feed: FEED,
  terms: "The Space declares CC BY 4.0 in https://huggingface.co/spaces/launch/MLRC_Bench/blob/main/README.md.",
  harnesses: 'system',
  reference: ['MLAB'],
  aliases: {
    "claude-3-5-sonnet-v2": "claude-3-5-sonnet-october-2024",
    "llama3-1-405b-instruct": "llama-3-1-405b"
  },
  async fetch() {
    const relative = await fetchJson<Results>(FEED);
    await new Promise(r => setTimeout(r,1000));
    const absolute = await fetchJson<Results>(FEED.replace('relative_improvement_to_human','absolute_improvement_to_baseline'));
    this.parts = {};
    const models = new Set(Object.values(relative).flatMap(Object.keys));
    const rows: LeaderboardRow[] = [];
    for (const name of models) {
      if (name === 'Top Human in Competition') continue;
      const model = name.match(/MLAB \(([^)]+)\)$/)?.[1];
      if (!model) throw new Error('Unknown MLRC agent format: '+name);
      const metrics: Record<string,number> = {};
      const rel: number[] = [], abs: number[] = [];
      for (const [task,label] of Object.entries(tasks)) {
        const a = absolute[task]?.[name], r = relative[task]?.[name];
        if (!Number.isFinite(a) || !Number.isFinite(r)) throw new Error('Missing task '+task+' for '+name);
        rel.push(r); abs.push(a);
        metrics[task] = r; metrics[task+'_abs'] = a;
        this.parts[task] = {name: label, group: 'Relative Improvement to Human'};
        this.parts[task+'_abs'] = {name: label, group: 'Absolute Improvement to Baseline'};
      }
      metrics.absoluteAverage = abs.reduce((a,b) => a+b,0)/abs.length;
      const other = name.match(/CoI-Agent \(([^)]+)\)/)?.[1];
      rows.push({model, harness: name.startsWith('MLAB') ? 'MLAB' : name, models: other ? [model,other] : undefined, score: rel.reduce((a,b) => a+b,0)/rel.length, metrics});
    }
    if (rows.length < 7) throw new Error('Missing MLRC-Bench agents');
    return rows;
  },
};
export default board;
