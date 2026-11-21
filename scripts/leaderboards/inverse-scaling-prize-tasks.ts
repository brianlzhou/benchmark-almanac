// The Inverse Scaling Prize tests tasks where larger models can perform worse.
// Wei et al. publish exact PaLM results in Table 2. Figure 8 defines accuracy as
// "the average accuracy of ten tasks that use accuracy as the metric, excluding Prompt Injection that uses loss as the metric."
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://aclanthology.org/2023.emnlp-main.963.pdf';
const sizes = ['1B', '8B', '62B', '540B'];
const board: Leaderboard = {
  benchmark: 'inverse-scaling-prize-tasks', host: 'Wei et al.', url: 'https://aclanthology.org/2023.emnlp-main.963/', feed, static: 'paper',
  headline: 'The score averages the ten accuracy tasks. Prompt injection uses loss and appears separately.',
  terms: 'ACL publishes the paper at https://aclanthology.org/2023.emnlp-main.963/ under its anthology publication terms.',
  aliases: { 'PaLM 540B': 'palm-540b' },
  async fetch() {
    const pdf = await pdfText(feed);
    const table = pdf.split('Table 2: Exact results for all Inverse Scaling Prize tasks')[0].split('\f').at(-1);
    if (!table || !/Task\s+Prompting\s+1B\s+8B\s+62B\s+540B\s+Scaling/.test(table)) throw new Error('Missing exact PaLM results');
    const parts: NonNullable<Leaderboard['parts']> = {};
    const configs = new Map<string, LeaderboardRow>();
    let task = '';
    for (const line of table.split('\n')) {
      const match = line.trim().match(/^(?:(.+?)\s{2,})?(Default|1-shot \(official\)|1-shot \(controlled\)|[01]-shot CoT)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)(?:\s|$)/);
      if (!match) continue;
      if (match[1]) task = match[1].replace('†', '').replace(' (loss)', '');
      const loss = task === 'Prompt injection';
      const key = task.toLowerCase().replaceAll(' ', '_');
      parts[key] = loss ? { name: task, unit: 'score', better: 'lower', note: 'Sequence loss.' } : task;
      sizes.forEach((size, i) => {
        if (match[i + 3] === '-') return;
        const setting = match[2];
        const id = size + ':' + setting;
        const row = configs.get(id) ?? { model: 'PaLM ' + size, setting, score: 0, metrics: {} };
        if (key in row.metrics!) throw new Error('Duplicate task for ' + id);
        row.metrics![key] = Number(match[i + 3]);
        configs.set(id, row);
      });
    }
    const keys = Object.keys(parts).filter(k => k !== 'prompt_injection');
    if (keys.length !== 10 || !parts.prompt_injection) throw new Error('Missing prize tasks');
    for (const row of configs.values()) {
      row.score = Number((keys.reduce((sum, k) => sum + row.metrics![k], 0) / 10).toFixed(4));
    }
    board.parts = parts;
    return checked([...configs.values()], 19);
  },
};
export default board;
