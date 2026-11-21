// RAFT tests few-shot classification across eleven real-world datasets. Table 2 reports macro F1.
// The authors average across all datasets. The importer converts their fractions to percentages.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2109.14076';
const board: Leaderboard = {
  benchmark: 'raft-real-world-annotated-few-shot-tasks',
  static: 'paper',
  url: feed,
  feed,
  terms: PAPER_TERMS + ' https://info.arxiv.org/help/license/index.html',
  parts: {"ADE":"ADE Corpus V2","B77":"Banking77","NIS":"NeurIPS impact statement risks","OSE":"OneStopEnglish","Over":"Overruling","SOT":"Semiconductor org types","SRI":"Systematic review inclusion","TAI":"TAI safety research","ToS":"Terms of Service","TEH":"TweetEval Hate","TC":"Twitter complaints"},
  aliases: {"GPT-3 (175B)":"gpt-3-175b-davinci","GPT-3":"gpt-3-175b-davinci","GPT-2 (1.6B)":"gpt-2-1-5b","GPT-Neo (2.7B)":"gpt-neo-2-7b"},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const keys = ['ADE', 'B77', 'NIS', 'OSE', 'Over', 'SOT', 'SRI', 'TAI', 'ToS', 'TEH', 'TC'];
    const table = tables.find(t => t[0]?.join('|') === ['Baseline', 'Avg', ...keys].join('|'));
    if (!table) throw new Error('Missing RAFT baseline F1 scores');
    const rows = table.slice(1).filter(([label]) => !/^(Human|Plurality class)/.test(label)).map(([label, ...cells]) => {
      if (cells.length !== 12 || !cells.every(value => /^\d*\.\d+$/.test(value))) throw new Error('Invalid RAFT result');
      const [score, ...values] = cells.map(v => Number((100 * Number(v)).toFixed(3)));
      const model = label.replace(' Zero-shot', '');
      const setting = label.endsWith('Zero-shot') ? 'Zero-shot' : model === 'AdaBoost' ? 'Supervised' : 'Few-shot';
      return { model, score, setting, metrics: Object.fromEntries(keys.map((key, i) => [key, values[i]])) };
    });
    return checked(rows, 6);
  },
};
export default board;
