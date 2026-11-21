// ProOPF-B tests whether models produce working optimal power flow programs.
// Table 1 gives average accuracy for all four levels, including separate prompting and fine-tuning conditions.
// The levels appear in concrete and abstract modeling groups, so their numerical order differs from the printed order.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2602.03070';
const board: Leaderboard = {
  benchmark: 'proopf-b', static: 'paper', url: feed, feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: { level1: 'Level 1', level2: 'Level 2', level3: 'Level 3', level4: 'Level 4' },
  aliases: { 'Claude 4.5 Sonnet': 'claude-sonnet-4-5', 'Gemini 3.0 Pro': 'gemini-3-pro' },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[1]?.join('|') === 'Setting|Model|Level 1|Level 3|Level 2|Level 4|Average');
    if (!table) throw Error('Missing Table 1 level scores');
    return checked(table.slice(2).map(([condition,label,...cells]) => {
      const variant = label.match(/^(.+) \((few-shot|zero-shot)\)$/);
      if (cells.length !== 5) throw Error('Missing model accuracy');
      const [level1,level3,level2,level4,score] = cells.map(numberCell);
      return { model: variant?.[1] ?? label, setting: variant ? condition + ', ' + variant[2] : condition,
        score, metrics: {level1,level2,level3,level4} };
    }), 14);
  },
};
export default board;
