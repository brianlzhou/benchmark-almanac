// AgentDAM tests privacy in web agents. Table 8 reports the percentage of tasks
// without a disclosure, overall utility, and raw counts for each website.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2503.09780';
const board: Leaderboard = {
  benchmark: 'ai-agent-privacy',
  url: feed,
  feed,
  static: 'paper',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2503.09780.',
  aliases: {
    'gpt-4o-mini (snapshot unspecified)': 'gpt-4o-mini',
    'llama-3.3-70b-chat': 'llama-3-3-70b-instruct',
  },
  parts: { shopping: 'Shopping', reddit: 'Reddit', gitlab: 'GitLab' },
  stats: {
    utility: { name: 'Utility', unit: '%', better: 'higher' },
    shoppingSolved: { name: 'Shopping tasks solved', unit: 'count' },
    redditSolved: { name: 'Reddit tasks solved', unit: 'count' },
    gitlabSolved: { name: 'GitLab tasks solved', unit: 'count' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(table => table[0]?.join('|') === 'Agent|Observation|Mitigation|Total|Total|shopping (84)|shopping (84)|reddit (114)|reddit (114)|gitlab (48)|gitlab (48)' && table[1]?.[4].startsWith('priv'));
    if (!table) throw new Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const [model, observation, mitigation, ...values] = cells;
      if (values.length !== 8) throw new Error('Missing privacy or utility values');
      const [utility, privacy, shoppingSolved, shoppingLeaks, redditSolved, redditLeaks, gitlabSolved, gitlabLeaks] = values.map(numberCell);
      rows.push({ model: model.replace(/\s+-/g, '-'), setting: observation + ', ' + mitigation,
        score: Number((100 * privacy).toFixed(3)), metrics: { utility: Number((100 * utility).toFixed(3)),
          shopping: 100 * (84 - shoppingLeaks) / 84, reddit: 100 * (114 - redditLeaks) / 114,
          gitlab: 100 * (48 - gitlabLeaks) / 48, shoppingSolved, redditSolved, gitlabSolved } });
    }
    return checked(rows, 24);
  },
};
export default board;
