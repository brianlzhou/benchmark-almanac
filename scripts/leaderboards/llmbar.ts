// LLMBar tests whether evaluators prefer the output that follows an instruction.
// The paper's comparison, rating and in-context tables report average accuracy across five subsets.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2310.07641';
const subsets = ['Natural', 'Neighbor', 'GPTInst', 'GPTOut', 'Manual', 'Adversarial'];
const specs = [
  ['S4.T2', 'gpt-4-0613'], ['S4.T3', ''], ['A3.T5', 'gpt-3.5-turbo-0613'],
  ['A3.T6', 'gpt-3.5-turbo-0301'], ['A3.T7', 'LLaMA-2-70B-Chat'], ['A3.T8', 'text-bison-001'],
  ['A3.T9', 'Falcon-180B-Chat'], ['A4.T11', 'gpt-4-0613'], ['A5.T12', 'Prometheus'], ['A5.T13', ''],
];
const shots: Record<string, string> = { 'GPT-4': 'gpt-4-0613', 'ChatGPT-0613': 'gpt-3.5-turbo-0613',
  'ChatGPT-0301': 'gpt-3.5-turbo-0301', LLaMA2: 'LLaMA-2-70B-Chat', Falcon: 'Falcon-180B-Chat' };
const board: Leaderboard = {
  benchmark: 'llmbar', static: 'paper', url: feed, feed,
  terms: 'The authors release their evaluation results under MIT. https://github.com/princeton-nlp/LLMBar',
  parts: Object.fromEntries(subsets.map(key => [key, key])),
  stats: Object.fromEntries(['Agreement', 'Different ratings'].flatMap(name => [...subsets, 'Overall'].map(part =>
    [part + ': ' + name, { name: part + ': ' + name, unit: '%', better: 'higher' }]))),
  aliases: { 'gpt-4-0613': 'gpt-4-jun-2023', 'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023',
    'gpt-3.5-turbo-0301': 'gpt-3-5-turbo-mar-2023', 'LLaMA-2-70B-Chat': 'llama-2-70b', 'Falcon-180B-Chat': 'falcon-180b' },
  async fetch() {
    const figures = (await paperHtml(feed)).match(/<figure\b[^>]*>[\s\S]*?<\/figure>/g) ?? [];
    const rows: LeaderboardRow[] = [];
    for (const [id, base] of specs) {
      const figure = figures.find(f => f.startsWith('<figure id="' + id + '"'));
      const table = figure && inlinePaperTables(figure)[0];
      if (!table || table[0].at(-1) !== 'Average' || table[2].at(-2) !== 'Acc.') throw new Error('Missing LLMBar table ' + id);
      const second = table[2].at(-1) === 'Agr.' ? 'Agreement' : 'Different ratings';
      for (const r of table.slice(3)) {
        if (r[0] === 'Random Guess' || (id === 'A5.T13' && r[1] === '0')) continue;
        const model = base || (id === 'A5.T13' ? shots[r[0]] : r[0]);
        let setting = r[0].replace('*', ' + Rules');
        if (id === 'S4.T3') setting = '';
        if (id === 'A4.T11') setting += ' (rating)';
        if (id === 'A5.T12') setting = r[0] === '-' ? 'Without reference' : 'With reference';
        if (id === 'A5.T13') setting = 'Vanilla + Rules, ' + r[1] + '-shot';
        const values = r.slice(-14);
        const metrics: Record<string, number> = {};
        [...subsets, 'Overall'].forEach((part, i) => {
          if (i < 6) metrics[part] = numberCell(values[2 * i]);
          if (values[2 * i + 1] !== '-') metrics[part + ': ' + second] = numberCell(values[2 * i + 1]);
        });
        rows.push({ model, setting: setting || undefined, score: numberCell(values[12]), metrics });
      }
    }
    return checked(rows, 71);
  },
};
export default board;
