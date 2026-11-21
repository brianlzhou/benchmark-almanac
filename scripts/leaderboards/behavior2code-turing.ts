// Behavior2Code ranks agents by pass@3 on 60 programs. Turing's chart reads model summaries in the public JavaScript bundle and shows one standard error on either side.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://labs.turing.com/assets/index-BZIruKnx.js";

const board: Leaderboard = {
  benchmark: "behavior2code-turing",
  url: "https://labs.turing.com/benchmarks/behavior2code",
  feed: FEED,
  terms: "The publisher gives no reuse license on the benchmark page. https://labs.turing.com/benchmarks/behavior2code The robots.txt URL serves the site HTML.",
  async fetch() {
    const source = await fetchText(FEED);
    const rows = [...source.matchAll(/\{key:"[^"]+",model:"([^"]+)",provider:"[^"]+",scaffold:"([^"]+)",[^{}]*?\}/g)]
      .filter(([record]) => record.includes('tasksSolved:') && record.includes('nearPassRate:')).map(([record, model, scaffold]) => {
        const metrics: Record<string, number> = {};
        for (const match of record.matchAll(/,(\w+):(-?(?:\d+\.?\d*|\.\d+))(?=[,}])/g)) metrics[match[1] === 'se' ? 'stderr' : match[1] === 'passRate' ? 'passAt3' : match[1]] = Number(match[2]);
        for (const key of ['passAt3', 'stderr', 'meanCostUsd', 'meanWallMinutes', 'passAt1', 'tasksSolved', 'runs']) {
          if (!Number.isFinite(metrics[key])) throw new Error(`Missing ${key} for ${model}`);
        }
        const [harness, setting] = scaffold.split(' · ');
        const score = metrics.passAt3;
        return { model, harness, setting, score, cost: metrics.meanCostUsd, trials: 3,
          low: score - metrics.stderr, high: score + metrics.stderr, metrics: { ...metrics, latency: metrics.meanWallMinutes * 60 } };
      });
    if (rows.length < 6) throw new Error('Expected six Behavior2Code model summaries');
    return rows;
  },
};
export default board;
