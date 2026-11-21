// UniCode tests programs on generated competitive coding problems. Table 1 ranks configurations by average Pass@1.
// It also reports difficulty scores, the change when each test family is removed, and dollars per problem.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2510.17868';
const headers = ['Model', 'Easy', 'Medium', 'Hard', '\\Delta_{Rand}', '\\Delta_{Adv}', '\\Delta_{Corn}', 'Avg. Pass@1', 'Cost / Prob. ($)'];
function numeric(cell: string) {
  const value = cell.replace(/^\\mathit\{(.*)\}$/, '$1').replace(/\\?%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) throw new Error('Unexpected Table 1 value: ' + cell);
  return Number(value);
}
const board: Leaderboard = {
  benchmark: 'unicode-competitive-coding', feed, url: feed, static: 'paper',
  terms: 'arXiv terms apply to the authors’ results. https://info.arxiv.org/help/license/index.html',
  parts: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
  stats: {
    deltaRand: { name: 'Pass@1 change without random tests', unit: '%', note: 'Overall Pass@1 minus Pass@1 without randomly generated tests.' },
    deltaAdv: { name: 'Pass@1 change without adversarial tests', unit: '%', note: 'Overall Pass@1 minus Pass@1 without adversarially generated tests.' },
    deltaCorn: { name: 'Pass@1 change without corner tests', unit: '%', note: 'Overall Pass@1 minus Pass@1 without corner-generated tests.' },
  },
  aliases: { 'deepseek-chat-v3.1': 'deepseek-v3-1', 'deepseek-v3.1': 'deepseek-v3-1', 'qwen-2.5-32b-coder': 'qwen2-5-coder-32b' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => headers.every((h, i) => t[1]?.[i] === h));
    if (!table) throw new Error('UniCode leaderboard headers missing');
    const rows = table.slice(2).filter(r => !r.every(v => v === r[0])).map(r => {
      const name = r[0].replace(/ \*$/, '');
      const match = name.match(/^(.+) \((high|medium|thinking)\)$/);
      const [easy, medium, hard, deltaRand, deltaAdv, deltaCorn, score] = r.slice(1, 8).map(numeric);
      return { model: match?.[1] ?? name, setting: match?.[2], score,
        cost: r[8] === '-' ? undefined : numeric(r[8]), metrics: { easy, medium, hard, deltaRand, deltaAdv, deltaCorn } };
    });
    return checked(rows, 21);
  },
};
export default board;
