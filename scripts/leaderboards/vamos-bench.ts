// VAmoS Bench ranks voice agents by task completion on simulated customer calls.
// The Veris table lists the speech stack, underlying model, call metrics and cost.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://veris.ai/leaderboard/vamos";

const board: Leaderboard = {
  benchmark: "vamos-bench",
  url: "https://veris.ai/leaderboard/vamos",
  feed: FEED,
  terms: "Veris reserves all rights. The public terms give no separate permission to reproduce leaderboard tables. https://veris.ai/terms-and-conditions Veris allows the /leaderboard/ path in robots.txt.",
  harnesses: 'system',
  stats: {
    connect: { name: 'Connection rate', unit: '%', better: 'higher' },
    latencySeconds: { name: 'Latency', unit: 'seconds', better: 'lower' },
    turns: { name: 'Turns per call', unit: 'count' },
    bargeInsPerCall: { name: 'Barge-ins per call', unit: 'count', better: 'lower' },
  },
  chart: {
    title: 'Cost vs. completed tasks',
    note: 'Task completion rate against estimated cost per call, matching the scatter chart on the Veris VAmoS leaderboard.',
    x: { key: 'cost', label: 'Estimated cost per call', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Task completion', unit: '%', better: 'higher' },
  },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.[0]?.text === 'Voice agent');
    const headers = ['Voice agent', 'Task completion', 'Connect', 'Latency', 'Turns', 'Barge-in/call', 'Cost', 'STT', 'LLM', 'TTS'];
    if (!table || table.length < 18 || !headers.every((h, i) => table[0][i]?.text === h)) throw new Error('Missing VAmoS standings');
    return table.slice(1).map(row => {
      const integrated = row[7]?.attrs.colspan === '3';
      const model = integrated ? row[7].text : row[8]?.text;
      const [score, connect, latencySeconds, turns, bargeInsPerCall] = row.slice(1, 6).map(c => num(c.text));
      if (!model || !row[0].text || [score, connect, latencySeconds, turns, bargeInsPerCall].some(x => x == null) ||
          (!integrated && (!row[7].text || !row[9]?.text))) throw new Error('Incomplete VAmoS entry');
      return { model, harness: row[0].text.replace(/\*$/, ''), trials: 3, score: score!, cost: num(row[6].text),
        setting: integrated ? undefined : 'STT: ' + row[7].text + ' / TTS: ' + row[9].text,
        metrics: { connect: connect!, latencySeconds: latencySeconds!, turns: turns!, bargeInsPerCall: bargeInsPerCall! } };
    });
  },
};
export default board;
