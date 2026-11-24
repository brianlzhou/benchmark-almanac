// Fox tests text recognition and fine-grained document understanding.
// Tables 2 and 3 compare models on single-page OCR. The first measure is English edit distance.
// Lower edit distance is better. The other tests report different measures and focus modes.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2405.14295';
const columns = ['Edit Distance', 'F1-score', 'Precision', 'Recall', 'BLEU', 'METEOR'];
const parts: Record<string, BoardPart> = {};
for (const language of ['English', 'Chinese']) {
  for (const name of columns) parts[language + name] = { name: language + ' ' + name, group: language,
    unit: 'score', better: name === 'Edit Distance' ? 'lower' : 'higher', note: 'Reported on a 0 to 1 scale.' };
}
const board: Leaderboard = {
  benchmark: 'fox-document-benchmark', static: 'paper', url: feed, feed, parts,
  aliases: { 'LLaVA-NeXT': 'llava-v1-6-34b' },
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper gives no overall score. The headline is English single-page OCR edit distance, where lower is better.',
  async fetch() {
    const header = ['Method', 'Params', ...columns.map((v,i) => v + (i ? ' \\uparrow' : ' \\downarrow'))];
    const tables = paperTables(await paperHtml(feed)).map(grid).filter(t => JSON.stringify(t[0]) === JSON.stringify(header));
    if (tables.length !== 2 || tables[0].length !== 9 || tables[1].length !== 7) throw Error('Missing English or Chinese OCR table');
    const rows = new Map<string, LeaderboardRow>();
    for (const [i, table] of tables.entries()) {
      const language = i ? 'Chinese' : 'English';
      for (const cells of table.slice(1)) {
        const label = cells[0].replace(/\s*\[.*?\]/g, '');
        const focus = label === 'Fox (foreground focus)';
        const row = rows.get(label) ?? { model: focus ? 'Fox' : label, setting: focus ? 'foreground focus' : undefined,
          score: NaN, metrics: {} };
        for (const [j,name] of columns.entries()) {
          const value = cells[j+2]?.trim() ? Number(cells[j+2]) : NaN;
          if (!Number.isFinite(value)) throw Error('Missing ' + language + ' ' + name);
          row.metrics![language + name] = value;
          if (i === 0 && j === 0) row.score = value;
        }
        rows.set(label,row);
      }
    }
    return checked([...rows.values()],8);
  },
};
export default board;
