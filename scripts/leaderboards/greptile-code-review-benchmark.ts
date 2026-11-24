// Greptile's comparison measures whether a review tool found the original bug in each
// of 50 pull requests. The Overall Performance chart gives the catch rate and the
// severity chart gives catch rates for four groups.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://www.greptile.com/benchmarks';
const board: Leaderboard = {
  benchmark: 'greptile-code-review-benchmark', url: feed, feed,
  terms: 'Greptile publishes this comparison under https://www.greptile.com/terms-of-service.',
  parts: { Critical: 'Critical', High: 'High', Medium: 'Medium', Low: 'Low' },
  async fetch() {
    const page = text(await fetchText(feed));
    const overall = page.split('Overall Performance ')[1]?.split(' CRITICAL')[0];
    const severity = page.split('Bug Detection by Severity Level ')[1]?.split(' Methodology')[0];
    if (!overall || !severity) throw new Error('Missing catch rate charts');
    const rows = [...overall.matchAll(/(\d+(?:\.\d+)?)%\s+([A-Za-z][\w.-]*)/g)].map(m => ({
      model: m[2], score: Number(m[1]), metrics: {} as Record<string, number>,
    }));
    if (!severity.endsWith(rows.map(row => row.model).join(' '))) throw new Error('Severity chart legend changed');
    let remaining = severity;
    for (const key of ['Critical', 'High', 'Medium', 'Low']) {
      const end = remaining.indexOf(' ' + key + ' ');
      if (end < 0) throw new Error('Missing severity group ' + key);
      const values = remaining.slice(0, end).trim().split(/\s+/);
      if (values.length !== rows.length || values.some(v => !/^\d+(?:\.\d+)?%$/.test(v))) throw new Error('Invalid severity chart');
      rows.forEach((row, i) => { row.metrics[key] = parseFloat(values[i]); });
      remaining = remaining.slice(end + key.length + 2);
    }
    return checked(rows, 5);
  },
};
export default board;
