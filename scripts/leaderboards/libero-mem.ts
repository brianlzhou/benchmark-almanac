// LIBERO-Mem scores from the AllenAI VLA Evaluation Harness leaderboard.
import { vlaEvalHarnessBoard } from '../lib/boards/vla-eval-harness.ts';

export default vlaEvalHarnessBoard({
  benchmark: 'libero-mem',
  vlaBenchmark: 'libero_mem',
  headline: 'Mean subgoal completion rate across the ten standard LIBERO-Mem tasks (T1 to T10). Entries on non-standard task subsets without an overall score are excluded.',
  partSpecs: {
    t1: { source: 'task', sourceKey: 'T1', name: 'Task 1' },
    t2: { source: 'task', sourceKey: 'T2', name: 'Task 2' },
    t3: { source: 'task', sourceKey: 'T3', name: 'Task 3' },
    t4: { source: 'task', sourceKey: 'T4', name: 'Task 4' },
    t5: { source: 'task', sourceKey: 'T5', name: 'Task 5' },
    t6: { source: 'task', sourceKey: 'T6', name: 'Task 6' },
    t7: { source: 'task', sourceKey: 'T7', name: 'Task 7' },
    t8: { source: 'task', sourceKey: 'T8', name: 'Task 8' },
    t9: { source: 'task', sourceKey: 'T9', name: 'Task 9' },
    t10: { source: 'task', sourceKey: 'T10', name: 'Task 10' },
  },
  minimum: 4,
});
