// LingOly tests linguistic reasoning on UK Linguistics Olympiad puzzles.
// Table 6 gives exact-match accuracy and Table 7 gives its gain over no context.
// Table 4 reports API expenditure across repeated runs and validation.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.06196';
const groups = ['Breakthrough/Foundation', 'Intermediate/Advanced/Round 2', 'Overall'];
export default {
  benchmark: 'lingoly', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2406.06196',
  aliases: {'Claude Opus': 'claude-3-opus', 'GPT-4o (snapshot unspecified)': 'gpt-4o-may-2024',
    'GPT-4 (snapshot unspecified)': 'gpt-4-turbo-apr-2024', 'GPT-3.5': 'gpt-3-5-turbo-jan-2024'},
  parts: Object.fromEntries([...groups.slice(0, 2), ...groups.map(g => g + ' context gain')].map(name => [name, {name, unit: '%' as const}])),
  async fetch() {
    const html = await paperHtml(feed);
    const table = (caption: string) => {
      const figure = (html.match(/<figure\b[^>]+class="ltx_table"[^>]*>[\s\S]*?<\/figure>/g) ?? []).find(f => f.includes(caption));
      if (!figure) throw new Error('Missing ' + caption);
      const gridRows = grid(paperTables(figure)[0]);
      if (gridRows[0].join('|') !== '|' + groups.join('|')) throw new Error('Missing difficulty groups');
      return gridRows.slice(1);
    };
    const exact = table('Detailed Exact Match Scores');
    const delta = table('Table 7:');
    const costs = paperTables(html).map(grid).find(t => t[0].join('|') === 'Model|Cost');
    if (!costs) throw new Error('Missing study costs');
    function percent(cell: string) {
      if (!/^-?\d+(?:\.\d+)?%$/.test(cell)) throw new Error('Invalid accuracy: ' + cell);
      return parseFloat(cell);
    }
    return checked(exact.map(([label, easy, hard, overall]) => {
      const gain = delta.find(row => row[0] === label);
      if (!gain) throw new Error('Missing context comparison: ' + label);
      const metrics = {[groups[0]]: percent(easy), [groups[1]]: percent(hard),
        ...Object.fromEntries(groups.map((g,i) => [g + ' context gain', percent(gain[i+1])]))};
      const cost = costs.find(row => row[0] === label)?.[1];
      if (cost) metrics.studyApiSpendUsd = Number(cost.replace('$',''));
      const model = label === 'Command R+' ? 'Command R+ (2024 study)' : label;
      return {model, score: percent(overall), metrics};
    }), 12);
  },
} satisfies Leaderboard;
