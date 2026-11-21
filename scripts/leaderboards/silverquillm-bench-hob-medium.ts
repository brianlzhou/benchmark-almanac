// SilverquiLLM-bench tests agents on five Hobbit cards. The October hob-medium table reports
// mean hidden-test pass rates, observed run ranges and API costs at maximum effort.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://snowfoxbuilds.com/silverquillm";
const board: Leaderboard = {
  benchmark: 'silverquillm-bench-hob-medium',
  url: "https://snowfoxbuilds.com/silverquillm#results",
  feed,
  terms: "Snowfox permits crawling in robots.txt. The repository uses MIT for software and documentation and gives no separate results license.",
  costPer: 'run',
  async fetch() {
    const html = await fetchText(feed);
    const table = tables(html).find(t => t[0].some(c => c.text.includes('Pass rate range')));
    if (!html.includes('Latest results · hob-medium') || !table || table.length < 7) throw new Error('Missing hob-medium results');
    return table.slice(1).map(cells => {
      const config = cells[0].text.match(/^(.+) (\S+ effort)$/);
      const range = cells[1].text.match(/^range ([\d.]+)% to ([\d.]+)%$/);
      const mean = cells[2].text.match(/^([\d.]+)%$/), cost = cells[3].text.match(/^\$([\d.]+)$/);
      if (!config || !range || !mean || !cost) throw new Error('Invalid hob-medium row');
      return { model: config[1], setting: config[2], score: Number(mean[1]), cost: Number(cost[1]),
        metrics: { minimumPassRate: Number(range[1]), maximumPassRate: Number(range[2]) } };
    });
  },
};
export default board;
