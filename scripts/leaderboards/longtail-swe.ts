// Longtail-SWE tests repository repairs in 13 programming languages.
// Table 1 reports mean pass@1 over three attempts per task. Table 2 reports pass@1 by language.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.10304';
const board: Leaderboard = {
  benchmark: 'longtail-swe', static: 'paper', url: feed, feed,
  terms: 'The authors publish Tables 1 and 2 under the terms at https://arxiv.org/abs/2611.10304.',
  aliases: { 'Opus 5.5': 'claude-opus-5-5', 'GPT 6.1 Sol': 'gpt-6-1-sol', 'GPT 5.6 Sol': 'gpt-5-6-sol',
    'GPT 5.6 Luna': 'gpt-5-6-luna', 'Qwen 3.6 27B': 'qwen3-6-27b' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.join('|') === 'Model|Context limit|Pass@1 \\pm SEM|Pass@3|All-3|Mean total tokens|Mean steps');
    const lang = tables.find(t => t[0]?.[0] === 'Language' && t[0]?.[1] === 'N');
    if (!main || !lang || lang.at(-1)?.[0] !== 'Overall' || lang.length !== 15) throw new Error('Missing Longtail-SWE results');
    const languages = lang.slice(1, -1);
    board.parts = Object.fromEntries(languages.map(([name]) => [name, { name, group: 'Language' }]));
    return checked(main.slice(1).map(([config, context, pass1, passAt3, pass3, tokens, steps]) => {
      const identity = config.match(/^(.+) \(([^)]+)\)$/);
      const column = lang[0].indexOf(config);
      if (!identity || column < 2 || !/^\d+(\.\d+)?M$/.test(tokens)) throw new Error('Invalid configuration');
      const [score, stderr] = pass1.split(' \\pm ').map(numberCell);
      if (!Number.isFinite(stderr)) throw new Error('Missing standard error');
      return { model: identity[1], harness: 'SWE-agent-like scaffold', setting: identity[2] + ', ' + context + ' context',
        score, trials: 3, metrics: { stderr, passAt3: numberCell(passAt3), pass3: numberCell(pass3),
          totalTokens: numberCell(tokens.slice(0, -1)) * 1e6, steps: numberCell(steps),
          ...Object.fromEntries(languages.map(row => [row[0], numberCell(row[column])])) } };
    }), 9);
  },
};
export default board;
