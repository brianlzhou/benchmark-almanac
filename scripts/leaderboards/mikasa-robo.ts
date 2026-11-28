// MIKASA-Robo scores from the AllenAI VLA Evaluation Harness leaderboard.
import { vlaEvalHarnessBoard } from '../lib/boards/vla-eval-harness.ts';

export default vlaEvalHarnessBoard({
  benchmark: 'mikasa-robo',
  vlaBenchmark: 'mikasa',
  headline: 'Arithmetic mean success rate across the five standard MIKASA-Robo memory tasks. Entries on non-standard task subsets without an overall score are excluded.',
  partSpecs: {
    shellGameTouch: { source: 'task', sourceKey: 'ShellGameTouch', name: 'Shell game touch' },
    interceptMedium: { source: 'task', sourceKey: 'InterceptMedium', name: 'Intercept medium' },
    rememberColor3: { source: 'task', sourceKey: 'RememberColor3', name: 'Remember color 3' },
    rememberColor5: { source: 'task', sourceKey: 'RememberColor5', name: 'Remember color 5' },
    rememberColor9: { source: 'task', sourceKey: 'RememberColor9', name: 'Remember color 9' },
  },
  minimum: 10,
});
