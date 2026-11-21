// CASE-Bench tests whether a model agrees with people about the safety of answering a query in context.
// Tables 2, 3, and 5 report classification accuracy, recall for each class, and probability-based measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2501.14940';
const board: Leaderboard = {
  benchmark: 'case-bench', url: feed, feed, static: 'paper',
  terms: 'Tables credited to the authors. https://proceedings.mlr.press/v267/sun25ab.html',
  stats: {
    pcc: { name: 'Pearson correlation coefficient', unit: '%', better: 'higher', note: 'Agreement between human and language-model safety ratings, reported on a 0 to 100 scale.' },
    bce: { name: 'Binary cross-entropy', unit: 'score', better: 'lower', note: 'Cross-entropy between human and language-model safety ratings.' },
  },
  aliases: { 'Claude-3.5-sonnet (snapshot unspecified)': 'claude-3-5-sonnet',
    'Llama-3-70B-Instruct': 'llama-3-70b', 'Llama-3-8B-Instruct': 'llama-3-8b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b', 'Mixtral 8x7B Instruct': 'mixtral-8x7b' },
  parts: { safe: { name: 'Safe recall', unit: '%' }, unsafe: { name: 'Unsafe recall', unit: '%' } },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const results = tables.filter(t => t[0]?.some(cell => cell.startsWith('R (Safe / Unsafe)')));
    if (results.length !== 3) throw new Error('Missing safety classification tables');
    const rows: LeaderboardRow[] = [];
    for (const t of results) {
      const guard = t[0][0] === 'Setting';
      const header = t[0].slice(guard ? 1 : 2);
      if (header.length !== 4 || !['Accuracy','R (Safe / Unsafe)','PCC','BCE'].every((label,i) => header[i].startsWith(label))) throw new Error('Changed results columns');
      let model = '';
      for (const r of t.slice(1)) {
        model = guard ? 'Llama-Guard-3-8B' : r[0].split(' (')[0] || model;
        if (model === 'Combining All Models') continue;
        const [acc, recall, pcc, bce] = r.slice(guard ? 1 : 2);
        const pct = (value: string) => numberCell(value.replace(/\s*%$/, ''));
        const [safe, unsafe] = recall.split(/\s*\/\s*/).map(pct);
        if (!Number.isFinite(unsafe)) throw new Error('Missing class recall');
        const metrics: Record<string,number> = {safe, unsafe};
        if (pcc !== '–') metrics.pcc = numberCell(pcc);
        if (bce !== '–') metrics.bce = numberCell(bce);
        rows.push({ model, setting: r[guard ? 0 : 1], score: pct(acc), metrics });
      }
    }
    return checked(rows, 37);
  },
};
export default board;
