// OpenHuEval tests Hungarian language knowledge. The official leaderboard lists HuWildBench WBScore
// first and reports accuracies for the other task families, with no single aggregate.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://opendatalab.github.io/OpenHuEval/leaderboard.html';
const board: Leaderboard = {
  benchmark: 'openhueval', url: feed, feed,
  terms: 'The authors publish these results at https://opendatalab.github.io/OpenHuEval/leaderboard.html.',
  headline: 'OpenHuEval reports no overall score, so the headline is HuWildBench WBScore, the first measure on its leaderboard.',
  aliases: {QwQ: 'qwq-32b-preview'},
  parts: {},
  async fetch() {
    const t = tables(await fetchText(feed)).map(grid).find(t => t[0]?.[1] === 'HuWildBench');
    if (t?.[1]?.join('|') !== 'Model|WBScore|Acc|Acc. (OE)|Acc. (2CQ)|B acc.|Q acc.|B acc.|Q acc.') throw new Error('Missing Hungarian task metrics');
    const rows = t.slice(2).map(([model, ...cells]) => {
      if (cells.length !== 8) throw new Error('Incomplete OpenHuEval row');
      const metrics: Record<string,number> = {};
      for (const [i, v] of cells.entries()) {
        const name = t[0][i+1] + ' ' + t[1][i+1], key = name.replace(/[^A-Za-z0-9]/g,'');
        board.parts![key] = {name, unit: i === 0 ? 'score' : '%'};
        metrics[key] = numberCell(v);
      }
      const snapshot = model === 'GPT-4o' ? 'gpt-4o-2024-11-20' : model === 'GPT-4o-mini' ? 'gpt-4o-mini-2024-07-18' : model;
      return {model: snapshot, score: numberCell(cells[0]), metrics};
    });
    return checked(rows, 10);
  },
};
export default board;
