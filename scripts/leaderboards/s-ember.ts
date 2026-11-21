// S-EMBER tests memory for events in first-person video. Table 3 reports several separate evaluations.
// The headline is five-way multiple-choice accuracy. Free-form and interval scores retain the paper's scales.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2607.02689';
export default {
  benchmark: 's-ember', url, feed: url, static: 'paper',
  headline: 'The headline is five-way multiple-choice accuracy on the streaming memory questions.',
  terms: 'The authors publish the comparison in Table 3. https://arxiv.org/abs/2607.02689',
  aliases: { 'Qwen3VL-32B': 'qwen3-vl-32b-instruct' },
  parts: Object.fromEntries([
    { key: 'clean', name: 'Clean accuracy', unit: '%' },
    { key: 'overall', name: 'Overall free-form accuracy', unit: '%' },
    { key: 'hallucination', name: 'Hallucination rate', unit: '%', better: 'lower' },
    { key: 'miou', name: 'Mean intersection over union', unit: 'score' },
    { key: 'recall', name: 'Recall at IoU 0.5', unit: 'score' },
    { key: 'grounded', name: 'Grounded accuracy at IoU 0.5', unit: 'score' },
  ].map(({ key, ...part }) => [key, part])) as Record<string, import('./types.ts').BoardPart>,
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.[4] === 'MCQ' && t[1]?.join('|') === 'Model|Acc_{cl}|Acc_{ov}|Halluc.|Acc|mIoU|R@1 \\geq .5|GQ@.5');
    if (!table) throw new Error('Missing main S-EMBER comparison');
    const num = (s: string) => {
      if (!/^\d+(\.\d+)?%?$/.test(s)) throw new Error('Invalid score: ' + s);
      return parseFloat(s);
    };
    const rows = table.slice(2).filter(c => !['Human Ceiling', 'Socratic Baseline'].includes(c[0])).map(c => {
      const blind = c[0] === 'Blind LLM';
      const model = blind ? 'GPT-4o' : c[0];
      const setting = blind ? 'Text only' : model === 'GPT-5.4' ? 'Up to 50 images' :
        model === 'Gemini 3.1 Pro' ? 'Native video at 1 fps' : '128 uniformly sampled frames';
      const metrics: Record<string, number> = { clean: num(c[1]), overall: num(c[2]), hallucination: num(c[3]) };
      if (!blind) Object.assign(metrics, { miou: num(c[5]), recall: num(c[6]), grounded: num(c[7]) });
      return { model, setting, score: num(c[4]), metrics };
    });
    return checked(rows, 6);
  },
} satisfies Leaderboard;
