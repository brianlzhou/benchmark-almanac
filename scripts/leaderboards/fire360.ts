// Fire360 evaluates perception in degraded firefighting videos. Its results table starts with visual
// question answering accuracy. Other tasks use different metrics and only some evaluate the same models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/fire360bench/fire360bench.github.io/main/index.html';
const tasks = [
  ['vqa', 'Visual Question Answering (VQA)', 'Top-1 accuracy'], ['caption', 'Temporal Action Captioning', 'BLEU-4'],
  ['localization', 'Object Localization under Distortion', 'Mean IoU'], ['safety', 'Safety-Critical Reasoning', 'Checklist accuracy'],
  ['retrieval', 'Transformed Object Retrieval (TOR)', 'Retrieval accuracy'],
];
const board: Leaderboard = {
  benchmark: 'fire360', url: 'https://fire360bench.github.io/#results', feed,
  terms: 'The authors publish research results and their responsible-use terms. https://fire360bench.github.io/',
  parts: Object.fromEntries(tasks.map(([key, name, note]) => [key, { name, note, unit: key === 'caption' ? 'score' : '%' }])),
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join() === 'Model,Score,Human,Metric');
    if (!table) throw new Error('Missing Fire360 results');
    const rows = new Map<string, LeaderboardRow>();
    let task: string[] | undefined;
    const seen = new Set<string>();
    for (const row of table.slice(1)) {
      const [name, score, , metric] = row.map(c => c.text);
      if (name.startsWith('Task: ')) {
        task = tasks.find(t => t[1] === name.slice(6));
        if (!task) throw new Error('Unknown Fire360 task');
        seen.add(task[0]);
        continue;
      }
      if (!task || metric !== task[2] || !/^\d+(?:\.\d+)?%?$/.test(score)) throw new Error('Invalid task score');
      const model = name.replace(/ \(prompted\)$/, '');
      const value = parseFloat(score);
      if (task[0] === 'vqa') rows.set(model, { model, score: value, metrics: {} });
      const entry = rows.get(model);
      if (entry) entry.metrics![task[0]] = value;
    }
    if (seen.size !== tasks.length) throw new Error('Missing Fire360 task');
    const result = [...rows.values()];
    checked(result.map(row => ({ ...row })), 6);
    return result;
  },
};
export default board;
