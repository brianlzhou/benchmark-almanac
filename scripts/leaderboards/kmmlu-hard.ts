// KMMLU-Hard tests Korean exam questions that models frequently miss.
// Table 4 reports five-shot accuracy with direct answers and chain of thought. Table 21 gives chain-of-thought accuracy by subject.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2402.11548';
const domains = ['STEM', 'Applied Science', 'HUMSS', 'Other'];
const board: Leaderboard = {
  benchmark: 'kmmlu-hard', url: feed, feed, static: 'paper',
  terms: 'The authors publish these tables under the terms at https://arxiv.org/abs/2402.11548.',
  aliases: { 'gpt-4-0125-preview': 'gpt-4-turbo-jan-2024' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const header = ['Model', ...[...domains, 'Total'].flatMap(name => [name, name])];
    const overall = tables.find(t => t[0]?.join('|') === header.join('|') && t[1]?.[1] === 'Direct' && t[1]?.[2] === 'CoT');
    const subjects = tables.find(t => t[0]?.join('|') === 'Category|Qwen-72B-Chat|HCX.|GPT-3.5-Turbo|GPT-4');
    if (!overall || subjects?.length !== 46) throw new Error('Missing KMMLU-Hard results table');
    board.parts = Object.fromEntries(domains.map(name => [name, { name, group: 'Domain' }]));
    const rows: LeaderboardRow[] = [];
    for (const row of overall.slice(2)) {
      const model = row[0];
      const subjectColumn = subjects[0].indexOf(model.replace('HyperCLOVA X', 'HCX.').replace('GPT-4-Turbo', 'GPT-4'));
      if (subjectColumn < 1) throw new Error('Missing KMMLU-Hard subject column for ' + model);
      for (const [i, method] of ['Direct', 'CoT'].entries()) {
        const metrics = Object.fromEntries(domains.map((name, j) => [name, numberCell(row[1 + j * 2 + i])]));
        if (method === 'CoT') for (const s of subjects.slice(1)) {
          metrics[s[0]] = numberCell(s[subjectColumn]);
          board.parts[s[0]] = { name: s[0].replaceAll('_', ' '), group: 'Subject' };
        }
        rows.push({ model: model === 'GPT-4-Turbo' ? 'gpt-4-0125-preview' : model, score: numberCell(row[9 + i]), setting: '5-shot, ' + method, metrics });
      }
    }
    return checked(rows, 8);
  },
};
export default board;
