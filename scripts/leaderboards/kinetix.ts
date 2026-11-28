// Kinetix 12-task RTC protocol scores from the AllenAI VLA Evaluation Harness leaderboard.
import { vlaEvalHarnessBoard } from '../lib/boards/vla-eval-harness.ts';

export default vlaEvalHarnessBoard({
  benchmark: 'kinetix',
  vlaBenchmark: 'kinetix',
  headlineSuite: 'd0',
  headline: 'Success rate at inference delay d=0 across the 12-task Kinetix real-time chunking protocol. Higher delay settings (d=1 through d=4) are stored as parts, and entries reporting only a cross-delay average are excluded.',
  partSpecs: {
    d1: { source: 'suite', sourceKey: 'd1', name: 'Delay 1' },
    d2: { source: 'suite', sourceKey: 'd2', name: 'Delay 2' },
    d3: { source: 'suite', sourceKey: 'd3', name: 'Delay 3' },
    d4: { source: 'suite', sourceKey: 'd4', name: 'Delay 4' },
  },
  minimum: 8,
});
