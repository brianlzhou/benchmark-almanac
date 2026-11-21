// ALCE evaluates language models that answer questions with citations on ASQA, QAMPARI, and ELI5.
// The headline uses the paper's citation-recall column from the ASQA full-results table.
// This importer reads Table 19 and preserves fluency, correctness, citation precision, and ROUGE-L.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2305.14627';
const board: Leaderboard = {
  benchmark: 'alce', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  headline: 'The paper reports several metrics, so this leaderboard uses the ASQA citation-recall column as its headline.',
  stats: {
    mauve: { name: 'MAUVE', unit: 'score', better: 'higher' },
    correctness: { name: 'Correctness', unit: '%', better: 'higher' },
    citationPrecision: { name: 'Citation precision', unit: '%', better: 'higher' },
    rougeL: { name: 'ROUGE-L', unit: 'score', better: 'higher' },
    length: { name: 'Output length', unit: 'count' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables[19];
    if (!table || table[1]?.[3] !== 'Rec.') throw new Error('ALCE ASQA full-results table missing');
    const rows: LeaderboardRow[] = [];
    let model = '';
    for (const row of table.slice(2)) {
      const label = row[0] ?? '';
      const first = Number.parseFloat(row[1] ?? '');
      if (!Number.isFinite(first)) {
        if (/^(ChatGPT|ChatGPT-16K|GPT-4)$/.test(label)) model = label;
        continue;
      }
      let setting = label;
      const named = label.match(/^(.+?) (Vanilla|Summ|Snippet|Oracle) \(([^)]+)\)$/);
      if (named) { model = named[1]; setting = `${named[2]} (${named[3]})`; }
      if (!model || /^(Oracle|Open-source)$/.test(label)) continue;
      const nums = row.slice(1, 7).map(v => Number.parseFloat(v));
      if (nums.some(n => !Number.isFinite(n))) continue;
      rows.push({ model, setting, score: nums[2], metrics: { mauve: nums[0], correctness: nums[1], citationPrecision: nums[3], rougeL: nums[4], length: nums[5] } });
    }
    return checked(rows, 10);
  },
};
export default board;
