// Animation Bench evaluates coding agents that rebuild the behavior of real web animations.
// Read the overall score, its interval and the individual task scores from Physera's two result tables.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const page = 'https://www.physera.ai/research/animation';
const harness = 'Computer-1 on Harbor';
const shortNames: Record<string, string> = {
  'GPT-6.1 Sol': 'Sol 6.1', 'GPT-6 Astra': 'Astra', 'Claude Fable 5.1': 'Fable',
  'Claude Opus 5.5': 'Opus', 'GPT-6 Sol': 'Sol',
};
const number = (s: string) => {
  if (!/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Animation Bench: expected a numeric cell, got ' + s);
  return Number(s);
};

const board: Leaderboard = {
  benchmark: 'animation-bench-physera', url: page + '#leaderboard', feed: page,
  terms: 'Physera allows the research page in robots.txt and gives no score reuse license.',
  reference: [harness],
  stats: {
    taskWins: { name: 'Tasks won', unit: 'count' },
  },
  async fetch() {
    const html = await fetchText(page);
    const all = tables(html);
    const main = all.find(t => t[0].map(c => c.text).join('|') === 'Rank|Model|Score|Visual|Motion|Layout|Task wins|$ / task');
    const tasks = all.find(t => t[0][0]?.text === 'Task' && t[0].some(c => c.text === 'Trigger'));
    const counts = html.match(/(\d+) models · (\d+) tasks · \d+ reconstructions/);
    if (!counts || !main || !tasks || main.length - 1 !== Number(counts[1]) || tasks.length - 1 !== Number(counts[2]))
      throw new Error('Animation Bench: incomplete result tables');
    const parts: Record<string, BoardPart> = { visual: { name: 'Visual' }, motion: { name: 'Motion' }, layout: { name: 'Layout' } };
    const rows = main.slice(1).map(row => {
      const [, model, overall, visual, motion, layout, wins, cost] = row.map(c => c.text);
      const [rawScore, half] = overall.split(/\s*±\s*/).map(number);
      const column = tasks[0].findIndex(c => c.text === (shortNames[model] ?? model));
      if (column < 1 || half === undefined) throw new Error('Missing Animation Bench result for ' + model);
      const metrics: Record<string, number> = { visual: number(visual), motion: number(motion), layout: number(layout), taskWins: number(wins) };
      for (const task of tasks.slice(1)) {
        const key = task[0].text;
        parts[key] = { name: key, group: 'Task' };
        metrics[key] = number(task[column].text);
      }
      return { model, score: rawScore, low: rawScore - half, high: rawScore + half, metrics, harness,
        setting: 'Maximum reasoning effort', cost: number(cost.replace(/^\$\s*/, '')) };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
