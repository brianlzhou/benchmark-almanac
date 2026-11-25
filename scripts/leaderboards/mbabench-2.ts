// Full 101-task pass rate. Difficulty subsets use separate candidates.
import {mbaBoard} from '../lib/boards/mbabench.ts';
const base = mbaBoard('mbabench-2');
const board = {
  ...base,
  harnesses: 'system' as const,
  reference: ['In-house harness'],
  parts: {
    numericalAccuracy: { name: 'Numerical accuracy', group: 'Dimension' },
  },
  stats: {
    passed: { name: 'Passed tasks', unit: 'count' as const },
    accuracyStandardError: { name: 'Numerical accuracy standard error', unit: 'score' as const },
  },
  async fetch() {
    return (await base.fetch()).map((row) => {
      if (!row.metrics) return row;
      const { tasks: _tasks, ...metrics } = row.metrics;
      return { ...row, metrics };
    });
  },
};
export default board;
