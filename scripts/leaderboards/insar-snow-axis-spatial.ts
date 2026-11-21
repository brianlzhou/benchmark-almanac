// Axis Spatial ranks InSAR Regional Snow Mapping agents by their snow mapping score. Its page also publishes cost, tokens and time per task for each configuration.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import index from './spatial-agent-index-2.ts';

const feed = "https://www.axisspatial.com/arena/evaluations/insar-snow";

const board: Leaderboard = {
  benchmark: "insar-snow-axis-spatial",
  stats: { latency: { name: 'Time per task', unit: 'seconds', better: 'lower' }, uncachedInput: { name: 'Uncached input tokens', unit: 'tokens' }, cachedInput: { name: 'Cached input tokens', unit: 'tokens' }, output: { name: 'Output tokens', unit: 'tokens' }, totalTokens: { name: 'Total tokens', unit: 'tokens' } },
  url: "https://www.axisspatial.com/arena/evaluations/insar-snow",
  feed,
  terms: "Axis Spatial permits reuse of scores and charts with credit and a link to the source page. https://www.axisspatial.com/arena/methodology/data-policy The public evaluation page is allowed in robots.txt.",
  host: 'Axis Spatial',
  aliases: index.aliases,
  async fetch() {
    const all = tables(await fetchText(feed));
    const byColumn = (column: string) => {
      const t = all.find(t => t[0]?.some(c => c.text === column));
      if (!t || t.length < 18) throw new Error('Missing InSAR table: ' + column);
      return new Map(t.slice(1).map(row => [row[0].text, row]));
    };
    const rank = byColumn('InSAR Regional Snow Mapping score'), costs = byColumn('Cost per task (USD)');
    const tokens = byColumn('Output (reasoning included)'), times = byColumn('Time per task (min)');
    const count = (s: string) => { const n = num(s); return n == null ? undefined : n * (/k$/i.test(s) ? 1000 : /m$/i.test(s) ? 1e6 : 1); };
    return Array.from(rank, ([name, row]) => {
      const match = name.match(/^(.+) \(([^()]+)\), (.+)$/);
      const score = num(row[2].text), c = costs.get(name), t = tokens.get(name), d = times.get(name);
      if (!match || score == null || !c || !d || !t) throw new Error('Incomplete InSAR entry: ' + name);
      const href = row[0].html.match(/href="([^"]+)"/)?.[1];
      const metrics: Record<string, number> = {};
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
