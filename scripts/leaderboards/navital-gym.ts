// This Navital Gym record covers the 50 UPI Desk tasks. The site's UPI Desk table reports
// first-try success, strict pass rate, formatting errors and a link to the scored run.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';

const feed = 'https://navitallabs.com/labs/navital-gym/leaderboard';
const board: Leaderboard = {
  benchmark: 'navital-gym', url: feed, feed,
  terms: 'Public leaderboard from Navital Labs with links to each published run.',
  stats: {
    solved: { name: 'Solved tasks', unit: 'count', better: 'higher' },
    strictPass1: { name: 'Strict pass@1', unit: '%', better: 'higher' },
    passAll: { name: 'Pass rate across all tasks', unit: '%', better: 'higher' },
    errorRate: { name: 'Error rate', unit: '%', better: 'lower' },
    badFormatRate: { name: 'Bad-format rate', unit: '%', better: 'lower' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const table = tables(html).find(t => t[0]?.[1]?.text === 'Solved' && t[1]?.at(-1)?.html.includes('/runs/upi-'));
    if (!table || table.length < 6 || table[0].length !== 8) throw new Error('Missing UPI Desk results');
    return table.slice(1).map(r => {
      const model = text(r[0].html.split('<span')[0]);
      const solved = r[1].text.match(/(\d+) of (\d+) solved.*?([\d.]+)%/);
      const pass = r[4].text.match(/([\d.]+)%\s*\(k=\s*(\d+)/);
      const errs = r[5].text.match(/([\d.]+)%\s*\/\s*([\d.]+)%/);
      const link = r[7].html.match(/href="([^"]+)"/)?.[1];
      if (!model || !solved || !pass || !errs || !link) throw new Error('Incomplete UPI Desk row');
      return { model, score: Number(solved[3]), trials: Number(pass[2]), link, setting: 'UPI Desk',
        metrics: { solved: Number(solved[1]), strictPass1: parseFloat(r[3].text),
          passAll: Number(pass[1]), errorRate: Number(errs[1]), badFormatRate: Number(errs[2]) } };
    });
  },
};
export default board;
