// Sci-Agent-Exam ranks scientific agents by Overall Combined score. The page embeds the field, workflow and efficiency results in its DATA object.
// Pass@0.95 is the share of tasks that meet the 95 percent score threshold.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://skylenage-ai.github.io/Sci-Agent-Exam/leaderboard/";
interface Category { key: string; label: string }
interface Data {
  models: { id: string; name: string; cost: Record<string, number> }[];
  fields: Category[];
  task_types: Category[];
  scores: Record<string, Record<string, Record<string, number>>>;
}
function pct(value: number) {
  if (!Number.isFinite(value)) throw new Error('Missing Sci-Agent-Exam score');
  return Math.round(value * 10000) / 100;
}

const board: Leaderboard = {
  benchmark: "sci-agent-exam",
  url: "https://skylenage-ai.github.io/Sci-Agent-Exam/leaderboard/",
  feed: FEED,
  terms: "The repository uses Apache License 2.0. Individual scientific tasks retain their original licenses. https://github.com/SKYLENAGE-AI/Sci-Agent-Exam",
  stats: { programmatic: { name: 'Programmatic score', unit: '%', better: 'higher' }, llmJudge: { name: 'LLM judge score', unit: '%', better: 'higher' }, pass95: { name: 'Pass rate at 95 percent threshold', unit: '%', better: 'higher' }, turns: { name: 'Turns per task', unit: 'count' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, medianCost: { name: 'Median cost per task', unit: 'usd', better: 'lower' }, costPerPoint: { name: 'Cost per score point', unit: 'usd', better: 'lower' } },
  async fetch() {
    const data = jsonAfter<Data>(await fetchText(FEED), 'const DATA =');
    const categories = [...data.fields, ...data.task_types].filter(c => c.key !== 'overall');
    if (data.models.length < 10 || categories.length < 18) throw new Error('Incomplete Sci-Agent-Exam board');
    board.parts = Object.fromEntries(categories.map(c => [c.key, c.label]));
    return data.models.map(({ id, name, cost }) => {
      const scores = data.scores[id];
      const overall = scores.overall;
      const parts = Object.fromEntries(categories.map(c => [c.key, pct(scores[c.key].c)]));
      return { model: name, score: pct(overall.c), cost: cost.usd, tokens: cost.out_tok,
        metrics: { ...parts, programmatic: pct(overall.p), llmJudge: pct(overall.j), passRateAt95PercentThreshold: pct(overall.r),
          turns: cost.turns, latency: cost.min * 60, medianCost: cost.usd_med, costPerPoint: cost.dpp } };
    });
  },
};
export default board;
