// Cua-Bench EDA evaluates computer-use agents on 25 expert-authored KiCad schematic tasks.
// The board ranks models by full passes. Convert the count to a percentage of the 25 tasks.
// Read the rendered leaderboard table, including partial passes, mean reward and tool settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://cua.ai/cuabench/leaderboard';
const board: Leaderboard = {
  benchmark: 'cua-bench-eda-kicad', url: PAGE, feed: PAGE,
  stats: {
    fullPass: { name: 'Full passes', unit: 'count', better: 'higher' },
    partialPass: { name: 'Partial passes', unit: 'count', better: 'higher' },
    tasks: { name: 'Tasks', unit: 'count' },
    meanReward: { name: 'Mean reward', unit: 'score', better: 'higher' },
  },
  terms: 'Cua allows this page in robots.txt. Its terms at https://cua.ai/terms-of-service give no separate score license.',
  async fetch() {
    const table = tables(await fetchText(PAGE)).find(t => t[0].some(c => c.text === 'Mean reward'));
    if (!table || table[0].length !== 6 || !table[0][3].text.toLowerCase().includes('full pass'))
      throw new Error('Cua-Bench: missing pass and reward columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const [, name, , full, partial, reward] = cells.map(c => c.text);
      const pass = /^(\d+) \/ (\d+)$/.exec(full);
      const part = /^(\d+) \/ (\d+)$/.exec(partial);
      if (!pass || !part || !name || pass[2] !== part[2] || !Number(pass[2]) || !/^\d+\.\d+$/.test(reward))
        throw new Error('Cua-Bench: incomplete result for ' + name);
      rows.push({ model: name.replace(/\s*[*†]+$/, ''), setting: name.includes('*') ? 'Function calling' : 'Native computer use',
        score: 100 * Number(pass[1]) / Number(pass[2]),
        metrics: { fullPass: Number(pass[1]), partialPass: Number(part[1]), tasks: Number(pass[2]), meanReward: Number(reward) } });
    }
    if (rows.length < 10) throw new Error('Cua-Bench: expected at least 10 models');
    return rows;
  },
};
export default board;
