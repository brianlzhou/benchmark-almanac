// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Robocurve's September experiment tests whether a model can place a block or puzzle piece with YAM arms.
// The results table gives completion rates over 20 trials per task and per-run resource estimates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://openai.robocurve.org/gpt-6-astra/';
const tasks = { bowl: 'Block into bowl', puzzle: 'Puzzle into groove' };
const board: Leaderboard = {
  benchmark: 'robocurve-simple-tasks-llm-control-of-yam-arms', url, feed: url,
  terms: 'Robocurve publishes its study and run records at https://openai.robocurve.org/gpt-6-astra/.',
  headline: 'The study reports no overall score, so this is the plain mean of its two task completion rates.',
  aliases: { 'Fable 5': 'claude-fable-5', 'Fable 5.1': 'claude-fable-5-1' },
  parts: Object.fromEntries(Object.entries(tasks).flatMap(([k,group]) =>
    [['Rate','Completion rate','%'],['Stage','Mean stage','score'],['Output','Output tokens per run','score'],
      ['Cost','Estimated cost per run','usd'],['Time','Minutes per run','minutes']].map(([s,name,unit]) => [k+s,{group,name,unit}]))),
  stats: { outputTokens: { name: 'Output tokens per run', unit: 'tokens' } },
  async fetch() {
    const t = tables(await fetchText(url)).find(t => t[0].map(c => c.text).join('|') ===
      'Task|Model|Mean stage|Completions|Rate|Output tokens/run|Est. cost/run|Minutes/run');
    if (!t) throw new Error('Missing task completion table');
    const models = new Map<string,LeaderboardRow>();
    for (const r of t.slice(1)) {
      const [task,model,stage,count,rate,tokens,cost,minutes] = r.map(c => c.text);
      const key = Object.entries(tasks).find(([,label]) => label === task)?.[0];
      const row = models.get(model) ?? {model, score: 0, trials: 0, metrics: {}, harness: 'Inspect Robots 0.58.0', setting: 'Medium thinking effort'};
      if (!key || key+'Rate' in row.metrics! || !count.endsWith(' / 20')) throw new Error('Unexpected trial group');
      const values = { Rate: parseFloat(rate), Stage: Number(stage), Output: parseFloat(tokens) * (tokens.endsWith('k') ? 1000 : 1),
        Cost: Number(cost.replace('$','')), Time: Number(minutes) };
      if (values.Rate !== 5 * parseInt(count)) throw new Error('Completion rate disagrees with trial count');
      for (const [suffix,v] of Object.entries(values)) {
        if (!Number.isFinite(v)) throw new Error('Invalid ' + suffix);
        row.metrics![key+suffix] = v;
      }
      row.trials! += 20;
      models.set(model,row);
    }
    const rows = [...models.values()].filter(r => r.trials === 40);
    for (const r of rows) {
      const m = r.metrics!;
      r.score = (m.bowlRate + m.puzzleRate) / 2;
      r.cost = (m.bowlCost + m.puzzleCost) / 2;
      m.outputTokens = (m.bowlOutput + m.puzzleOutput) / 2;
    }
    return checked(rows,3);
  },
};
export default board;
