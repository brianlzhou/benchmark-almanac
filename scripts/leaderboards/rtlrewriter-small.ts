// The Small Rewriter Benchmark tests whether rewritten Verilog uses less hardware.
// Table 4 reports geometric means over 14 short circuits. It lists wires first and cell counts separately.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2409.11414';
const board: Leaderboard = {
  benchmark: 'rtlrewriter-small', feed, url: feed, static: 'paper',
  headline: 'The headline is the geometric mean wire count on the 14 short circuits in Table 4.',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Test Case|Yosys|Yosys|Yosys+Egg|Yosys+Egg|GPT4|GPT4|Claude3|Claude3|VeriGen|VeriGen|RTLCoder|RTLCoder|RTLRwriter|RTLRwriter'
      && t[1]?.join('|') === 'ID|' + Array(7).fill('Wires|Cells').join('|'));
    if (table?.length !== 18 || table[16][0] !== 'GeoMean' || table[17][0] !== 'Ratio') throw Error('Missing short-circuit Table 4');
    board.parts = Object.fromEntries(table.slice(2,16).map(c => [c[0], c[0] + ' wires']));
    function count(s: string) {
      if (!/^\d+(?:\.\d+)?$/.test(s)) throw Error('Invalid Table 4 count');
      return Number(s);
    }
    return checked([5,7,9,11,13].map(i => {
      const metrics: Record<string, number> = { cells: count(table[16][i+1]), wireRatio: count(table[17][i]), cellRatio: count(table[17][i+1]) };
      for (const c of table.slice(2,16)) {
        metrics[c[0]] = count(c[i]);
        metrics[c[0] + ' cells'] = count(c[i+1]);
      }
      const identity = i === 13 ? { model: 'GPT-4V', harness: 'RTLRewriter' } : { model: table[0][i] };
      return { ...identity, score: count(table[16][i]), metrics };
    }), 5);
  },
};
export default board;
