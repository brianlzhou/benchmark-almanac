// EGI-Bench evaluates enterprise agents across eight benchmarks. Table 3 reports the weighted EGI
// score on a 0 to 100 scale and the six dimensions defined in Table 2.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.27234';

const board: Leaderboard = {
  benchmark: 'egi-bench', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2610.27234",
  aliases: {'Gemini 3.1 Pro Prev.':'gemini-3-1-pro','GPT-4o mini (snapshot unspecified)':'gpt-4o-mini'},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const dimensions = tables.find(t => t[0]?.join('|') === 'Metric|Weight|What it measures');
    const results = tables.find(t => t[0]?.join('|') === 'Model|Mode|EGI|M 1|M 2|M 3|M 4|M 5|M 6');
    if (!dimensions || !results) throw new Error('Missing EGI score or dimension definitions');
    const names = dimensions.slice(1,7).map(r => r[0].replace(/^M (\d) /, 'M$1: '));
    if (names.length !== 6) throw new Error('Missing enterprise dimension');
    board.parts = Object.fromEntries(names.map(k => [k,{name:k,unit:'score'}]));
    const rows: LeaderboardRow[] = results.slice(1).map(([model,setting,egi,...cells]) => {
      if (cells.length !== 6) throw new Error('Missing enterprise score');
      return {model, setting, score: numberCell(egi), metrics:Object.fromEntries(names.map((k,i) => [k,numberCell(cells[i])]))};
    });
    return checked(rows, 14);
  },
};
export default board;
