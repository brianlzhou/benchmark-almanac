// Veris ranks financial agents by a cost-adjusted index out of 1,000.
// Its Arena table publishes the index, three component scores and the price of a three-task basket.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://veris.ai/leaderboard/arena";

const board: Leaderboard = {
  benchmark: "veris-finagent-arena-1-1",
  url: "https://veris.ai/leaderboard/arena",
  feed: FEED,
  terms: "Veris reserves all rights. The public terms give no separate permission to reproduce leaderboard tables. https://veris.ai/terms-and-conditions Veris allows the /leaderboard/ path in robots.txt.",
  parts: { aml: 'AML Bench', treasury: 'TreasuryQA Bench', findesk: 'FinDesk-Bench' },
  stats: {
    quality: { name: 'Quality', unit: 'score', better: 'higher' },
    basketUsd: { name: 'Three-task basket cost', unit: 'usd', better: 'lower' },
    costPenalty: { name: 'Cost penalty', unit: 'score', better: 'lower' },
  },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.[3]?.text.startsWith('Index'));
    const headers = ['#', 'Agent', 'Harness', 'Index', 'Quality', 'AML Bench', 'TreasuryQA Bench', 'FinDesk-Bench', 'Basket', 'Cost penalty'];
    if (!table || table.length < 13 || !headers.every((h, i) => table[0][i]?.text.startsWith(h))) throw new Error('Missing FinAgent index');
    return table.slice(1).map(row => {
      if (row.length !== 10 || !row[1].text || !row[2].text) throw new Error('Missing FinAgent row');
      const [score, quality, aml, treasury, findesk, basketUsd, costPenalty] = row.slice(3).map(cell => {
        const value = num(cell.text.replace(/&minus;|−/g, '-'));
        if (value == null) throw new Error('Missing FinAgent metric');
        return value;
      });
      return { model: row[1].text, harness: row[2].text, score, metrics: { quality, aml, treasury, findesk, basketUsd, costPenalty } };
    });
  },
};
export default board;
