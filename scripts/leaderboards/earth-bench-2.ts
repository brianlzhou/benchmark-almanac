// Axis Spatial ranks Earth-Bench V2 agents by their text-task score. Its page also publishes cost, tokens and time per task for each configuration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import index from './spatial-agent-index-2.ts';

const feed = "https://www.axisspatial.com/arena/evaluations/earth-bench";

const board: Leaderboard = {
  benchmark: "earth-bench-2",
  url: "https://www.axisspatial.com/arena/evaluations/earth-bench",
  feed,
  terms: "Axis Spatial excludes picture questions from this agent ranking. Axis Spatial permits reuse of scores and charts with credit and a link to the source page. https://www.axisspatial.com/arena/methodology/data-policy The public evaluation page is allowed in robots.txt.",
  host: 'Axis Spatial',
  aliases: index.aliases,
  async fetch() {
    const all = tables(await fetchText(feed));
    const byColumn = (column: string) => {
      const t = all.find(t => t[0]?.some(c => c.text === column));
      if (!t || t.length < 93) throw new Error('Missing Earth-Bench table: ' + column);
      return new Map(t.slice(1).map(row => [row[0].text, row]));
    };
    const rank = byColumn('Earth-Bench V2 score'), costs = byColumn('Cost per task (USD)');
    const tokens = byColumn('Output (reasoning included)'), times = byColumn('Time per task (min)');
    const count = (s: string) => { const n = num(s); return n == null ? undefined : n * (/k$/i.test(s) ? 1000 : /m$/i.test(s) ? 1e6 : 1); };
    return Array.from(rank, ([name, row]) => {
      const match = name.match(/^(.+) \(([^()]+)\), (.+)$/);
      const score = num(row[2].text), c = costs.get(name), t = tokens.get(name), d = times.get(name);
      if (!match || score == null || !c || !d || !t) throw new Error('Incomplete Earth-Bench entry: ' + name);
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
