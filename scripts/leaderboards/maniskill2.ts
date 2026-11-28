// ManiSkill2 scores from the AllenAI VLA Evaluation Harness leaderboard.
import { vlaEvalHarnessBoard } from '../lib/boards/vla-eval-harness.ts';

export default vlaEvalHarnessBoard({
  benchmark: 'maniskill2',
  vlaBenchmark: 'maniskill2',
  headline: 'Mean success rate across the standard five ManiSkill2 manipulation tasks. Papers reporting non-standard task subsets without an overall score are excluded.',
  partSpecs: {
    pickCube: { source: 'task', sourceKey: 'PickCube', name: 'Pick cube' },
    stackCube: { source: 'task', sourceKey: 'StackCube', name: 'Stack cube' },
    pickSingleYcb: { source: 'task', sourceKey: 'PickSingleYCB', name: 'Pick single YCB' },
    pickSingleEgad: { source: 'task', sourceKey: 'PickSingleEGAD', name: 'Pick single EGAD' },
    pickClutterYcb: { source: 'task', sourceKey: 'PickClutterYCB', name: 'Pick clutter YCB' },
  },
  minimum: 10,
});
