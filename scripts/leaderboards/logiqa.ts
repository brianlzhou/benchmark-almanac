// LogiQA tests reading comprehension and logical reasoning. The authors call the English test LogiQA
// and report Chinese LogiQA separately. Table 3 gives test accuracy, and Table 4 adds transfer settings.
// Table 7 reports English RoBERTa accuracy by reasoning type.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2007.08124';
const board: Leaderboard = {
  benchmark: 'logiqa', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const main = tables.find(t => t[0].join('').replaceAll(' ', '').includes('LogiQALogiQAChineseLogiQAChineseLogiQA'));
    const transfer = tables.find(t => t[0].join('|') === 'Model|Dev|Test');
    const reasoning = tables.find(t => t[0].join('|') === 'Reasoning Type|RoBERTa');
    if (main?.[1].join('|') !== 'Category|Model|Dev|Test|Dev|Test' || !transfer || !reasoning)
      throw new Error('Missing LogiQA tables');
    const types = Object.fromEntries(reasoning.slice(1).map(([name, score]) => [name, numberCell(score)]));
    board.parts = { chinese: 'Chinese LogiQA', ...Object.fromEntries(Object.keys(types).map(name => [name, name])) };
    const rows: LeaderboardRow[] = main.slice(2).filter(r => r[0] !== 'Human' && !r[1].startsWith('Random')).map(r => {
      const model = r[1].replace(/ \S+ et al\. \(\d{4}\)$/, '');
      return { model, score: numberCell(r[3]), metrics: { dev: numberCell(r[2]), chinese: numberCell(r[5]),
        chineseDev: numberCell(r[4]), ...(model === 'RoBERTa' ? types : {}) } };
    });
    for (const [label, dev, score] of transfer.slice(1)) {
      if (label.startsWith('Random') || label.replaceAll(' ', '') === 'RoBERTaLogiQA') continue;
      const source = label.match(/^RoBERTa\{\}_\{(RACE|COSMOS)/)?.[1];
      if (!source) throw new Error('Unknown transfer configuration ' + label);
      const setting = label.includes('longrightarrow') ? source + ' then LogiQA' : source + ' only';
      rows.push({ model: 'RoBERTa', setting, score: numberCell(score), metrics: { dev: numberCell(dev) } });
    }
    return checked(rows, 11);
  },
};
export default board;
