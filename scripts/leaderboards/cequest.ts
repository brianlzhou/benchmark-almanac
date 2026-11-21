// CEQuest measures accuracy on construction estimating questions. ONESTRUCTION publishes answers from its pi harness.
// The model table supplies CEQuest accuracy, measured time and proprietary-model API cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const feed = "https://ai.onestruction.com/leaderboard/en/benchmarks/ceq/";

const board: Leaderboard = {
  benchmark: "cequest",
  url: "https://ai.onestruction.com/leaderboard/en/benchmarks/ceq/",
  feed,
  terms: "The independent board gives no explicit score reuse license. Exclude open model cost estimates that use Artificial Analysis pricing. https://ai.onestruction.com/leaderboard/en/methodology/ Robots.txt restricts named crawlers.",
  reference: ['pi'],
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === '#|Model|Score|Overall|Cost per task|Time per task');
    if (!t || t.length < 21) throw new Error('Missing CEQuest rankings');
    return t.slice(1).map(c => {
      const name = c[1].html.match(/class="model-title-name">([^<]+)/)?.[1];
      const href = c[1].html.match(/href="([^"]+)"/)?.[1];
      const score = c[2].html.match(/width:([\d.]+)%/);
      const time = c[5].text.match(/([\d.]+)s\s+([\d.]+) tok\/s/);
      if (!name || !href || !score || !time) throw new Error('Incomplete CEQuest row');
      const open = c[1].text.includes('Open weights');
      return { model: name, score: +score[1], harness: 'pi', setting: c[1].text.match(/\(\s*(.+?)\s*\)/)?.[1],
        link: new URL(href, feed).href, open, cost: open ? undefined : num(c[4].text),
        metrics: { latency: +time[1], tokensPerSecond: +time[2] } };
    });
  },
};

export default board;
