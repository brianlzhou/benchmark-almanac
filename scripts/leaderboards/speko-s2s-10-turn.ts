// Speko ranks ten-turn calls by median conversation latency in milliseconds. Its dated results table also reports task success and instruction following.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://speko.com/blog/gpt-realtime-2-1-mini-fastest";

const board: Leaderboard = {
  benchmark: "speko-s2s-10-turn",
  url: "https://speko.com/blog/gpt-realtime-2-1-mini-fastest",
  feed,
  terms: "The publisher does not specify separate score reuse terms in the supplied source. The feed host publishes robots.txt at https://speko.com/robots.txt.",
  async fetch() {
    const table = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)))
      .find(([h]) => h && ['Model', 'Conv. latency (p50)', 'Task', 'Instruction', 'Audio price'].every(k => h.includes(k)));
    if (!table || table.length < 10) throw new Error('Incomplete Speko standings');
    const [header, ...entries] = table;
    return entries.map(entry => {
      const cell = (k: string) => entry[header.indexOf(k)];
      const model = cell('Model'), latency = num(cell('Conv. latency (p50)'));
      const task = num(cell('Task')), instruction = num(cell('Instruction'));
      if (!model || latency === undefined || task === undefined || instruction === undefined) throw new Error('Missing Speko result');
      const metrics: Record<string, number> = { task, instruction };
      const amounts = [...cell('Audio price').matchAll(/\$([\d.]+)/g)].map(m => Number(m[1]));
      const unit = cell('Audio price').includes('/min') ? 'PerMinute' : 'PerMillionTokens';
      if (amounts.length === 2) {
        metrics['audioInputUsd' + unit] = amounts[0];
        metrics['audioOutputUsd' + unit] = amounts[1];
      } else if (amounts.length === 1) metrics['audioUsd' + unit] = amounts[0];
      return { model, score: latency, metrics, trials: 15, date: '2026-07-08' };
    });
  },
};
export default board;
