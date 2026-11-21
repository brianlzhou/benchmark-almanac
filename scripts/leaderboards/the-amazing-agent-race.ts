// The Amazing Agent Race tests whether agents solve connected web research and tool-use tasks.
// The project site's results table gives finish-line accuracy across 1,400 legs.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://minnesotanlp.github.io/the-amazing-agent-race/';
const board: Leaderboard = {
  benchmark: 'the-amazing-agent-race', feed, url: feed,
  terms: 'The authors release the project under the MIT License. https://github.com/minnesotanlp/the-amazing-agent-race/blob/main/LICENSE.md',
  stats: {
    pitStopVisitRate: {name: 'Pit stop visit rate', unit: '%', better: 'higher'},
    roadblockCompletionRate: {name: 'Roadblock completion rate', unit: '%', better: 'higher'},
  },
  aliases: {'Sonnet 4': 'claude-sonnet-4'},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Configuration|FA|PVR (Nav.)|RCR (Tool)');
    if (!table) throw new Error('Missing aggregate AAR results');
    const percent = (s: string) => {
      if (!/^\d+(?:\.\d+)?%$/.test(s)) throw new Error('Invalid percentage ' + s);
      return Number(s.slice(0, -1));
    };
    return checked(table.slice(1).map(row => {
      const [configuration, fa, pvr, rcr] = row.map(cell => cell.text);
      const [harness, model] = configuration.split(' + ');
      const metrics: Record<string, number> = {};
      if (!/^(?:—|&mdash;|--)$/.test(pvr)) metrics.pitStopVisitRate = percent(pvr);
      if (!/^(?:—|&mdash;|--)$/.test(rcr)) metrics.roadblockCompletionRate = percent(rcr);
      return {model, harness, score: percent(fa), metrics};
    }), 5);
  },
};
export default board;
