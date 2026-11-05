// BinaryAudit (Quesma) on quesma.com/benchmarks/binaryaudit, laid out like OTelBench: a ranking of bars,
// one per model, each titled with passed, failed and total runs. The pass rate (0 to 100) is the score. The
// reader lives in otelbench.ts. It also keeps, from the page's scatter-chart data, the whole run's cost
// (costPer 'run'), the average seconds per task (metrics.latency) and the false positive rate on clean
// binaries (metrics.fpr, a percentage), which the page's "Detection vs false alarms" chart plots.
import type { Leaderboard } from './types.ts';
import { QUESMA_TERMS, quesmaRows } from './otelbench.ts';

const board: Leaderboard = {
  benchmark: 'binaryaudit',
  url: 'https://quesma.com/benchmarks/binaryaudit/',
  feed: 'https://quesma.com/benchmarks/binaryaudit/ (ranking bars, passed over total runs; scatter-chart data for cost, time and false positive rate)',
  terms: QUESMA_TERMS,
  aliases: {},
  costPer: 'run',
  chart: {
    title: 'Detection vs false alarms',
    note: 'Pass rate at finding and locating a backdoor against how often a model wrongly flags clean code; models in the upper left detect more with fewer false alarms.',
    x: { key: 'fpr', label: 'False positive rate', unit: '%', better: 'lower' },
    y: { key: 'score', label: 'Pass rate', unit: '%', better: 'higher' },
  },
  fetch: () => quesmaRows('binaryaudit'),
};
export default board;
