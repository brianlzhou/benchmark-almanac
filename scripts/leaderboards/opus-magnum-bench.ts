// Opus Magnum Bench ranks puzzle solvers by the sum of their best human-normalized rewards. The public dashboard bundle contains the trials behind the table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://opusmagnumbench.com/data.js?v=b9c4a9c9c58e";
const board: Leaderboard = {
  benchmark: "opus-magnum-bench",
  url: "https://opusmagnumbench.com/",
  feed: FEED,
  terms: "The makers publish the results file. I found no reuse license on the dashboard. https://opusmagnumbench.com/ The host has no published robots directives at /robots.txt.",
  parts: { average: 'Reward (avg)', solved: 'Solved (pass@k)', steps: 'Avg steps', first: 'Steps to first solve', final: 'Steps to final solve', fail: 'Steps on fail' },
  async fetch() {
    type Trial = { solved: boolean; reward: number; usage?: { output_tokens?: number; cost_usd?: number; steps?: number }; prog?: { reward: number[][] } };
    type Data = { models: { short: string; key: string; isHumanBest?: boolean; isBaseline?: boolean }[]; puzzles: { id: string }[]; trials: Record<string, Trial> };
    const data = jsonAfter<Record<string, Data>>(await fetchText(FEED), 'window.MODEL_COMPARISON_DATASETS =')['sum-scores / campaign-full'];
    if (!data || data.puzzles.length < 36) throw new Error('Missing campaign puzzles');
    const groups = Map.groupBy(data.models.filter(m => !m.isHumanBest && !m.isBaseline), m => m.short);
    const mean = (values: number[]) => values.reduce((a,b) => a+b,0) / values.length;
    const rows = [...groups].map(([label, runs]) => {
      const metrics: Record<string, number> = { average: 0, solved: 0 };
      const usage: Record<string, number[]> = { steps: [], first: [], final: [], fail: [], cost: [], tokens: [] };
      let score = 0;
      for (const p of data.puzzles) {
        const trials = runs.map(m => data.trials[m.key + '::' + p.id]).filter(Boolean);
        if (!trials.length) continue;
        const rewards = trials.map(t => t.solved ? t.reward : 0);
        if (!rewards.every(Number.isFinite)) throw new Error('Invalid reward for ' + label);
        score += Math.max(...rewards);
        metrics.average += mean(rewards);
        if (trials.some(t => t.solved)) metrics.solved++;
        for (const t of trials) {
          const u = t.usage;
          if (u?.cost_usd != null) usage.cost.push(u.cost_usd);
          if (u?.output_tokens != null) usage.tokens.push(u.output_tokens);
          if (u?.steps != null) { usage.steps.push(u.steps); if (!t.solved) usage.fail.push(u.steps); }
          if (t.solved && t.prog?.reward.length) {
            usage.first.push(t.prog.reward[0][2] || 0); usage.final.push(t.prog.reward.at(-1)![2] || 0);
          }
        }
      }
      for (const key of ['steps','first','final','fail']) if (usage[key].length) metrics[key] = mean(usage[key]);
      const setting = label.match(/ \(([^)]+)\)$/)?.[1];
      return { model: setting ? label.slice(0, -(setting.length + 3)) : label, setting, score, metrics,
        cost: usage.cost.length ? mean(usage.cost) : undefined, tokens: usage.tokens.length ? mean(usage.tokens) : undefined };
    });
    if (rows.length < 20) throw new Error('Missing Opus Magnum models');
    return rows;
  },
};
export default board;
