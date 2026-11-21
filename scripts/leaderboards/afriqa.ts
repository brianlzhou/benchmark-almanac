// AfriQA tests open-retrieval question answering in ten African languages. Table 9 gives end-to-end F1.
// Only pipelines with scores for every language qualify. Table 11 adds language-level exact match and BLEU.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2305.06897';
const parts = { bem: 'Bemba', fon: 'Fon', hau: 'Hausa', ibo: 'Igbo', kin: 'Kinyarwanda', swa: 'Swahili',
  twi: 'Twi', wol: 'Wolof', yor: 'Yoruba', zul: 'Zulu' };
const board: Leaderboard = {
  benchmark: 'afriqa', feed, url: feed, static: 'paper', parts, harnesses: 'system',
  terms: 'The authors release their paper under CC BY 4.0, https://creativecommons.org/licenses/by/4.0/.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.includes('XOR-Full F1'));
    const appendix = tables.find(t => t[1]?.includes('XOR-Full BLEU'));
    const langs = Object.keys(parts);
    if (!main || !appendix || main[2].slice(3).join('|') !== [...langs, 'F1', 'EM', 'BLEU'].join('|'))
      throw new Error('Missing XOR-Full columns');
    const rows = main.slice(3).filter(r => !r.slice(3, 13).includes('—')).map(r => {
      const [query, answer, retriever] = r;
      const extra = appendix.slice(3).filter(c => c.slice(0, 3).join('|') === r.slice(0, 3).join('|'));
      if (extra.length !== 2) throw new Error('Missing XOR-Full appendix scores');
      const metrics: Record<string, number> = { exactMatch: Number(r[14]), bleu: Number(r[15]) };
      langs.forEach((key, i) => {
        metrics[key] = Number(r[i + 3]);
        metrics[key + 'BLEU'] = Number(extra[0][i + 3]);
        metrics[key + 'EM'] = Number(extra[1][i + 3]);
      });
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid language score');
      return { model: query, harness: retriever, models: [query, retriever, 'multilingual DPR reader'],
        setting: query + ' query translation, ' + answer + ' answer translation', score: Number(r[13]), metrics };
    });
    return checked(rows, 2);
  },
};
export default board;
