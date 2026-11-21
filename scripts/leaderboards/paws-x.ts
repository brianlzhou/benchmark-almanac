// PAWS-X tests cross-lingual paraphrase identification. Table 5 reports average accuracy across six translated languages.
// Table 4 also gives accuracy and AUC-PR by language, including English when available.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/1908.11828';
const board: Leaderboard = {
  benchmark: 'paws-x',
  static: 'paper',
  url: feed,
  feed,
  terms: PAPER_TERMS + ' https://info.arxiv.org/help/license/index.html',
  parts: {"en":"English","fr":"French","es":"Spanish","de":"German","zh":"Chinese","ja":"Japanese","ko":"Korean"},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const languages = ['en', 'fr', 'es', 'de', 'zh', 'ja', 'ko'];
    const detail = tables.find(t => t[0]?.[1] === 'Accuracy' && t[0][8] === 'AUC-PR'
      && t[1]?.slice(1).join('|') === [...languages, ...languages].join('|'));
    const summary = tables.find(t => t[1]?.join('|') === 'Method|Method|Accuracy|AUC-PR');
    if (!detail || !summary) throw new Error('Missing PAWS-X language or average results');
    const byRun = new Map<string, Record<string, number>>();
    let name = '';
    for (const [label, ...cells] of detail.slice(2)) {
      if (cells.every(v => !v)) {
        name = label;
        continue;
      }
      if (cells.length !== 14 || !cells.every(v => /^(\d+\.\d+|–)$/.test(v))) throw new Error('Invalid language scores');
      const metrics: Record<string, number> = {};
      languages.forEach((key, i) => {
        if (cells[i] !== '–') metrics[key] = Number(cells[i]);
        if (cells[i + 7] !== '–') metrics[key + 'AucPr'] = Number(cells[i + 7]);
      });
      byRun.set(name + '|' + label.toLowerCase(), metrics);
    }
    const rows = summary.slice(2).map(([model, setting, accuracy, aucPr]) => {
      const metrics = byRun.get(model + '|' + setting.toLowerCase());
      if (!metrics || ![accuracy, aucPr].every(v => /^\d+\.\d+$/.test(v))) throw new Error('Invalid PAWS-X summary');
      return { model, setting, score: Number(accuracy), metrics: { ...metrics, aucPr: Number(aucPr) } };
    });
    return checked(rows, 8);
  },
};
export default board;
