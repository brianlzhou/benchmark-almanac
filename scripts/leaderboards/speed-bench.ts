// SPEED-Bench compares speculative decoding methods. Table 1 reports mean acceptance length across domains at each temperature.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2604.09557';

const board: Leaderboard = {
  benchmark: 'speed-bench', static: 'paper',
  url: 'https://arxiv.org/abs/2604.09557',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Qwen3-Next": "qwen3-next-80b-a3b-instruct", "Qwen3 235B": "qwen3-235b-a22b", "DeepSeek R1": "deepseek-r1"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[1]?.[0] === 'Domain' && t[1].includes('EAGLE3'));
    if (!table || table[0].length < 11) throw new Error('Missing SPEED-Bench comparison');
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = { speedup: 'Mean Speedup' };
    function number(s: string) {
      if (!/^\d+\.\d+×?$/.test(s)) throw new Error('Invalid SPEED-Bench value');
      return Number(s.replace('×', ''));
    }
    for (let start = 2; start < table.length;) {
      const temp = table[start][1];
      if (!temp.startsWith('Temperature=')) throw new Error('Missing temperature');
      const avg = table.findIndex((r, i) => i > start && r[0] === 'Mean AL');
      if (avg < 0 || table[avg + 1]?.[0] !== 'Mean Speedup') throw new Error('Missing mean acceptance length or speedup');
      for (let col = 1; col < table[0].length; col++) {
        if (table[avg][col] === '(–)') continue;
        const metrics: Record<string, number> = { speedup: number(table[avg + 1][col]) };
        for (const domain of table.slice(start + 1, avg)) {
          const key = domain[0].toLowerCase();
          parts[key] = domain[0];
          metrics[key] = number(domain[col]);
        }
        const model = table[0][col].replace(' (*)', '');
        rows.push({ model, harness: table[1][col], setting: 'Qualitative / ' + temp + ' / BS=32 / DL=3', score: number(table[avg][col]), metrics });
      }
      start = avg + 2;
    }
    if (rows.length < 19) throw new Error('Incomplete SPEED-Bench comparison');
    board.parts = parts;
    return rows;
  },
};
export default board;
