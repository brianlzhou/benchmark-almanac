// The source reports no overall score. The headline is the plain mean of the 23 parts, computed by this importer.
// AECBench tests knowledge of architecture, engineering and construction. The authors normalize each task to a 0 to 100 scale.
// The Evaluation Results table in the authors' README gives one column per model.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/ArchiAI-LAB/AECBench/main/README.md';
const board: Leaderboard = {
  benchmark: 'aecbench-liang',
  feed,
  url: 'https://github.com/ArchiAI-LAB/AECBench#evaluation-results',
  terms: 'The authors specify CC BY-NC for non-commercial research. https://github.com/ArchiAI-LAB/AECBench/blob/main/LICENSE',
  aliases: { 'GPT-o3-mini': 'o3-mini' },
  async fetch() {
    const readme = await fetchText(feed);
    const section = readme.split('## Evaluation Results')[1]?.split('## License')[0];
    if (!section?.includes('higher is better')) throw new Error('AECBench evaluation results missing');
    const table = section.split('\n').filter(line => line.startsWith('|')).map(line =>
      line.trim().slice(1, -1).split('|').map(cell => cell.replace(/\*/g, '').trim()));
    const [heading, , ...tasks] = table;
    if (heading?.[0] !== 'Task ID' || heading.length < 10 || tasks.length !== 23) throw new Error('AECBench table changed');
    const labels = new Map<string, string>();
    for (const row of tables(readme).flat()) {
      const index = row.findIndex(cell => /^\d-\d(?:-\d)?$/.test(cell.text));
      if (index >= 0) labels.set(row[index].text, row[index + 1].text);
    }
    const parts: Record<string, string> = {};
    for (const [id, ...values] of tasks) {
      const label = labels.get(id);
      if (!label || id in parts || values.length !== heading.length - 1) throw new Error('Unexpected AECBench task ' + id);
      parts[id] = label;
    }
    board.parts = parts;
    return checked(heading.slice(1).map((model, i) => {
      const metrics: Record<string, number> = {};
      for (const task of tasks) {
        const value = task[i + 1];
        if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid score for ' + model + ' on task ' + task[0]);
        metrics[task[0]] = Number(value);
      }
      return { model, score: Object.values(metrics).reduce((sum, value) => sum + value, 0) / tasks.length, metrics };
    }), 9);
  },
};
export default board;
