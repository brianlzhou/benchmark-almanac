// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// TheGoldman tests retrieval from an encyclopedia of finance. The FinMTEB workbook gives NDCG at 10 in English and Chinese.
import type { Leaderboard } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { readXlsx } from './superclue.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://huggingface.co/spaces/FinanceMTEB/FinMTEB/resolve/main/benchmark.xlsx';
const board: Leaderboard = {
  benchmark: 'thegoldman-retrieval', url: 'https://huggingface.co/spaces/FinanceMTEB/FinMTEB', feed,
  terms: 'The leaderboard Space declares Apache 2.0. https://huggingface.co/spaces/FinanceMTEB/FinMTEB/blob/main/README.md',
  headline: 'The board reports no overall score, so the headline is the plain mean of the English and Chinese retrieval scores.',
  parts: { english: 'English', chinese: 'Chinese' },
  async fetch() {
    const workbook = readXlsx(Buffer.from(await fetchBytes(feed)));
    function scores(sheet: string, col: string) {
      const table = workbook.get('Retrieval_' + sheet);
      const i = table?.[0].indexOf(col) ?? -1;
      if (!table || table[0][0] !== 'Model' || i < 0) throw new Error('Missing ' + col);
      const result = new Map<string, number>();
      for (const r of table.slice(1)) {
        if (r[0] === 'BOW' || !r[i] || r[i] === '-') continue;
        const value = Number(r[i]);
        if (!r[0] || result.has(r[0]) || !Number.isFinite(value)) throw new Error('Invalid ' + col + ' row');
        result.set(r[0], value);
      }
      return result;
    }
    const en = scores('en', 'TheGoldmanEnRetrieval'), zh = scores('zh', 'TheGoldmanZhRetrieval');
    const rows = [];
    for (const [model, english] of en) {
      const chinese = zh.get(model);
      if (chinese !== undefined) rows.push({ model, score: (english + chinese) / 2, metrics: { english, chinese } });
    }
    return checked(rows, 4);
  },
};
export default board;
