// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// AMELIA tests argument classification in Italian tax decisions. CALAMITA publishes macro F1 for each task and prompting setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/CALAMITA-AILC/calamita-eval/main/results/README.md';
const tasks = ['arg-component', 'arg-premisetype', 'arg-scheme'];
const board: Leaderboard = {
  benchmark: 'amelia-italian-legal-argument-mining',
  url: 'https://github.com/CALAMITA-AILC/calamita-eval/blob/main/results/README.md',
  feed,
  host: 'CALAMITA',
  aliases: { 'meta-llama/Llama-3.1-8B-Instruct': 'llama-3-1-8b', 'meta-llama/Llama-3.1-70B-Instruct': 'llama-3-1-70b' },
  terms: 'CALAMITA publishes its leaderboard under Apache 2.0. https://github.com/CALAMITA-AILC/calamita-eval/blob/main/LICENSE',
  parts: Object.fromEntries(tasks.map(name => [name, name])),
  async fetch() {
    const readme = await fetchText(feed);
    const header = readme.split('\n').find(line => line.startsWith('| **Parent** | **Task** | **Metric** |'));
    const models = Array.from(header?.matchAll(/\[([^\]]+)\]\(https:\/\/huggingface\.co\//g) ?? [], match => match[1]);
    const section = readme.split('](small_task_description/amelia.md)')[1]?.split('| [**')[0];
    if (models.length < 4 || !section) throw new Error('Missing CALAMITA model columns or AMELIA results');
    const lines = section.trim().split('\n').map(line => line.trim().slice(1, -1).split('|').map(s => s.trim().replace(/\*/g, '')));
    const rows: LeaderboardRow[] = [];
    for (const setting of ['fewshot', 'zeroshot']) {
      const values = tasks.map(task => {
        const line = lines.find(c => c[1] === task + '-' + setting);
        if (!line || line[2] !== 'f1' || line.length !== models.length + 3) throw new Error('Missing AMELIA F1 columns for ' + task);
        return line.slice(3);
      });
      models.forEach((model, i) => {
        const scores = values.map(row => row[i]);
        if (!scores.every(s => /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(s))) throw new Error('Invalid F1 for ' + model);
        const metrics = Object.fromEntries(tasks.map((task, j) => [task, Number(scores[j])]));
        rows.push({ model, setting: setting === 'fewshot' ? 'Few-shot' : 'Zero-shot', metrics,
          score: Object.values(metrics).reduce((sum, value) => sum + value, 0) / tasks.length });
      });
    }
    return checked(rows, 8);
  },
};
export default board;
