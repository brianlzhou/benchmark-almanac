// Castellum compares standalone and harnessed agents on financial crime screening. Its detailed results table ranks each configuration by end-to-end accuracy.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://www.castellum.ai/financial-crime-agent-benchmark";
const parts = { scr_o: 'Screening overall', scr_s: 'Screening sanctions', scr_p: 'Screening PEPs', scr_a: 'Screening adverse media',
  adj_o: 'Adjudication overall', adj_s: 'Adjudication sanctions', adj_p: 'Adjudication PEPs', adj_a: 'Adjudication adverse media' };

const board: Leaderboard = {
  benchmark: "fincrime-agent-benchmark-castellum",
  url: "https://www.castellum.ai/financial-crime-agent-benchmark",
  feed: FEED,
  terms: "Castellum.AI restricts reproduction of its product. Its leaderboard gives no separate reuse grant. https://www.castellum.ai/terms-of-service The generic robots rules exclude search and account paths.",
  parts, reference: ['Standalone'], harnesses: 'system',
  async fetch() {
    const page = await fetchText(FEED);
    const match = page.match(/var DATA=(\[\{"label":[^\n]+?\]);/);
    if (!match) throw new Error('Missing Castellum detailed results');
    const data = JSON.parse(match[1]);
    if (!Array.isArray(data) || data.length < 9) throw new Error('Expected nine model pairs');
    return data.flatMap((entry) => ['s', 'h'].map((mode) => {
      const metrics = Object.fromEntries([...Object.keys(parts), 'con', 'miss'].map(k => [k, entry[k]?.[mode]]));
      const score = entry.e2e?.[mode];
      if (!entry.label || !Number.isFinite(score) || !Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete Castellum result');
      return { model: entry.label, score, trials: 3, harness: mode === 's' ? 'Standalone' : 'Castellum.AI Harness', metrics };
    }));
  },
};
export default board;
