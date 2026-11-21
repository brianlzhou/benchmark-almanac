// Behavior2Code ranks agents by pass@3 on 60 programs. Turing's chart reads model summaries in the public JavaScript bundle and shows one standard error on either side.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://labs.turing.com/assets/index-BZIruKnx.js";

const board: Leaderboard = {
  benchmark: "behavior2code-turing",
  url: "https://labs.turing.com/benchmarks/behavior2code",
  feed: FEED,
  terms: "The publisher gives no reuse license on the benchmark page. https://labs.turing.com/benchmarks/behavior2code The robots.txt URL serves the site HTML.",
  stats: {
    runs: { name: 'Runs', unit: 'count' },
    passAt3: { name: 'Pass@3', unit: '%', better: 'higher' },
    tasksSolved: { name: 'Tasks solved', unit: 'count' },
    passAt1: { name: 'Pass@1', unit: '%', better: 'higher' },
    passingRuns: { name: 'Passing runs', unit: 'count', better: 'higher' },
    nearPassRate: { name: 'Near-pass rate', unit: '%', better: 'higher', note: 'Percentage of runs that reached at least 0.90 reward without finishing the task.' },
    nearPassTasks: { name: 'Near-pass tasks', unit: 'count' },
    stableTasks: { name: 'Stable tasks', unit: 'count' },
    intermittentTasks: { name: 'Intermittent tasks', unit: 'count' },
    unknownTasks: { name: 'Unknown tasks', unit: 'count' },
    majoritySolvedTasks: { name: 'Majority-solved tasks', unit: 'count' },
    meanReward: { name: 'Mean reward', unit: 'score', better: 'higher', note: 'How much of the behavior the agent reproduced, averaged over every run, from 0 to 1.' },
    coverage: { name: 'Valid coverage', unit: '%', better: 'higher' },
    meanWallMinutes: { name: 'Mean wall-clock per run in minutes', unit: 'minutes', better: 'lower' },
    medianTurns: { name: 'Median turns per run', unit: 'count' },
    meanCostUsd: { name: 'Mean cost per run', unit: 'usd', better: 'lower' },
    timedOutRuns: { name: 'Timed-out runs', unit: 'count' },
    selfDeclaredCompleteRuns: { name: 'Self-declared complete runs', unit: 'count' },
    malformedTurnShare: { name: 'Malformed turns', unit: '%', better: 'lower', note: 'Share of agent turns that the harness rejected outright.' },
    medianAttemptSpread: { name: 'Median attempt spread', unit: 'score', note: 'Run-to-run variation across repeated attempts, reported separately from pass@3.' },
    latency: { name: 'Mean wall-clock per run in seconds', unit: 'seconds', better: 'lower', note: 'Mean wall-clock per run converted from minutes to seconds.' },
  },
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
