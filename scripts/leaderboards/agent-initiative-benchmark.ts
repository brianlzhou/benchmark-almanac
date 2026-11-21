// Full 50-situation leaderboard, excluding the separate illustrative task table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = 'https://deepnote.com/research/benchmark';
const board: Leaderboard = {
  benchmark: 'agent-initiative-benchmark', url: URL, feed: URL + ' (50-task leaderboard)',
  terms: 'Deepnote publishes the benchmark documentation under Apache-2.0 and PageMantle under CC BY 4.0. Robots.txt allows the research page. Source: Deepnote.',
  stats: {
    perfectTasks: { name: 'Perfect tasks', unit: 'count' },
    zeroTasks: { name: 'Zero-score tasks', unit: 'count' },
    helped: { name: 'Helped tasks', unit: 'count' },
    stayedSilent: { name: 'Stayed-silent tasks', unit: 'count' },
    secondsPerTask: { name: 'Seconds per task', unit: 'seconds', better: 'lower' },
    toolCallsPerTask: { name: 'Tool calls per task', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find(t => t[0]?.some(c => c.text === '10 / 10') && t[0]?.some(c => c.text === 'Cost / task'));
    if (!t) throw new Error('Deepnote full leaderboard missing');
    const headers = t[0].map(c => c.text);
    const rows: LeaderboardRow[] = t.slice(1).map(r => {
      const at = (label: string) => r[headers.indexOf(label)]?.text ?? '';
      const time = at('Time');
      const minutes = Number(time.match(/(\d+) min/)?.[1] ?? 0);
      const seconds = Number(time.match(/(\d+) s/)?.[1] ?? 0);
      return {model: at('Model'), score: num(at('Score'))!, cost: num(at('Cost / task')),
        setting: '180-second limit; 50 situations; two judges', harness: 'Deepnote Agent Initiative Benchmark',
        metrics: {perfectTasks: num(at('10 / 10'))!, zeroTasks: num(at('0 / 10'))!, helped: num(at('Helped'))!, stayedSilent: num(at('Stayed silent'))!, secondsPerTask: minutes * 60 + seconds, toolCallsPerTask: num(at('Tool calls'))!}};
    });
    if (rows.length < 3 || rows.some(r => !r.model || !Number.isFinite(r.score))) throw new Error('Deepnote results changed');
    return rows;
  },
};
export default board;
