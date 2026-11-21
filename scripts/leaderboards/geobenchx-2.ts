// Axis Spatial ranks GeoBenchX agents by their GIS task score. Its page also publishes cost, tokens and time per task for each configuration.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import index from './spatial-agent-index-2.ts';

const feed = "https://www.axisspatial.com/arena/evaluations/geobenchx";

const board: Leaderboard = {
  benchmark: "geobenchx-2",
  url: "https://www.axisspatial.com/arena/evaluations/geobenchx",
  feed,
  terms: "Axis Spatial permits reuse of scores and charts with credit and a link to the source page. https://www.axisspatial.com/arena/methodology/data-policy The public evaluation page is allowed in robots.txt.",
  parts: { solvable: 'Solvable tasks', correctRejection: 'Correct rejection' },
  stats: {
    impossibleAnswered: { name: 'Impossible answered', unit: 'count' },
    solvableRefused: { name: 'Solvable refused', unit: 'count' },
    latency: { name: 'Time per task', unit: 'seconds', better: 'lower' },
    uncachedInput: { name: 'Uncached input', unit: 'tokens' },
    cachedInput: { name: 'Cached input', unit: 'tokens' },
    output: { name: 'Output', unit: 'tokens' },
    totalTokens: { name: 'Total tokens', unit: 'tokens' },
  },
  host: 'Axis Spatial',
  aliases: index.aliases,
  async fetch() {
    const all = tables(await fetchText(feed));
    const byColumn = (column: string) => {
      const t = all.find(t => t[0]?.some(c => c.text === column));
      if (!t || t.length < 97) throw new Error('Missing GeoBenchX table: ' + column);
      return new Map(t.slice(1).map(row => [row[0].text, row]));
    };
    const rank = byColumn('GeoBenchX score'), costs = byColumn('Cost per task (USD)');
    const tokens = byColumn('Output (reasoning included)'), times = byColumn('Time per task (min)');
    const splits = byColumn('Correct rejection');
    const count = (s: string) => { const n = num(s); return n == null ? undefined : n * (/k$/i.test(s) ? 1000 : /m$/i.test(s) ? 1e6 : 1); };
    return Array.from(rank, ([name, row]) => {
      const match = name.match(/^(.+) \(([^()]+)\), (.+)$/);
      const score = num(row[2].text), c = costs.get(name), t = tokens.get(name), d = times.get(name);
      if (!match || score == null || !c || !d || !t) throw new Error('Incomplete GeoBenchX entry: ' + name);
      const href = row[0].html.match(/href="([^"]+)"/)?.[1];
      const metrics: Record<string, number> = {};
      const split = splits.get(name);
      if (!split) throw new Error('Missing GeoBenchX task breakdown: ' + name);
      for (const [i, key] of ['solvable', 'correctRejection', 'impossibleAnswered', 'solvableRefused'].entries()) {
        const v = num(split[i + 2].text);
        if (v != null) metrics[key] = v;
      }
      const mins = num(d[2].text);
      if (mins != null) metrics.latency = mins * 60;
      for (const [i, key] of ['uncachedInput', 'cachedInput', 'output', 'totalTokens'].entries()) {
        const v = count(t[i + 2].text);
        if (v != null) metrics[key] = v;
      }
      return { model: match[1], setting: match[2], harness: match[3], score, cost: num(c[2].text),
        tokens: metrics.output, link: href ? new URL(href, feed).href : undefined, metrics };
    });
  },
};

export default board;
