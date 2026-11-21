// Acme Agent Evals tests models on GitHub tasks. Arize ranks them by correctness.
// The article compares the Pi harness with a raw runner on the same tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://arize.com/blog/what-we-learned-testing-7-models-under-the-same-agent-harness/";

const board: Leaderboard = {
  benchmark: "acme-agent-evals",
  url: "https://arize.com/blog/what-we-learned-testing-7-models-under-the-same-agent-harness/",
  feed,
  terms: "The publisher displays results at https://arize.com/blog/what-we-learned-testing-7-models-under-the-same-agent-harness/. I could not verify reuse terms. The robots.txt permits this article.",
  stats: {
    examples: { name: 'Examples', unit: 'count' },
    outputQuality: { name: 'Output quality', unit: '%', better: 'higher' },
    efficiency: { name: 'Efficiency', unit: '%', better: 'higher' },
    latencyScore: { name: 'Latency score', unit: '%', better: 'higher' },
    toolAdherence: { name: 'Tool adherence', unit: '%', better: 'higher' },
    latency: { name: 'Average latency', unit: 'seconds', better: 'lower' },
    avgToolCalls: { name: 'Average tool calls', unit: 'count', better: 'lower' },
    runnerErrors: { name: 'Runner errors', unit: 'count', better: 'lower' },
  },
  aliases: { 'Sonnet 4.6': 'claude-sonnet-4-6', 'Sonnet 4.5': 'claude-sonnet-4-5', 'Sonnet 4.0': 'claude-sonnet-4' },
  async fetch() {
    const source = tables(await fetchText(feed));
    const rows: LeaderboardRow[] = [];
    for (const harness of ['Pi', 'Raw']) {
      const pi = harness === 'Pi';
      const headers = pi
        ? ['Model', 'Runs', 'Examples', 'Correctness', 'Output quality', 'Efficiency', 'Latency score', 'Tool adherence', 'Avg latency seconds', 'Avg tool calls']
        : ['Model', 'Pi correctness', 'Raw correctness', 'Pi tool adherence', 'Raw tool adherence', 'Raw runner errors'];
      const table = source.find(t => t[0]?.map(c => c.text).join('|') === headers.join('|'));
      if (!table || table.length < 8) throw new Error('Missing Acme ' + harness + ' results');
      for (const cells of table.slice(1)) {
        const values = cells.slice(1).map(c => num(c.text));
        if (!cells[0].text || values.length !== headers.length - 1 || values.some(v => v === undefined))
          throw new Error('Invalid Acme row');
        const v = values as number[];
        const metrics: Record<string, number> = pi
          ? { examples: v[1], outputQuality: v[3], efficiency: v[4], latencyScore: v[5], toolAdherence: v[6], latency: v[7], avgToolCalls: v[8] }
          : { toolAdherence: v[3], runnerErrors: v[4] };
        rows.push({ model: cells[0].text, harness, trials: pi ? v[0] : 10, score: pi ? v[2] : v[1], metrics });
      }
    }
    return rows;
  },
};

export default board;
