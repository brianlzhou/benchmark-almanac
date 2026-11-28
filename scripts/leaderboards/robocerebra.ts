// RoboCerebra scores from the AllenAI VLA Evaluation Harness leaderboard.
import { vlaEvalHarnessBoard } from '../lib/boards/vla-eval-harness.ts';

export default vlaEvalHarnessBoard({
  benchmark: 'robocerebra',
  vlaBenchmark: 'robocerebra',
  headline: 'Mean success rate across the six RoboCerebra evaluation dimensions.',
  partSpecs: {
    ideal: { source: 'suite', sourceKey: 'ideal', name: 'Ideal' },
    randomDisturbance: { source: 'suite', sourceKey: 'random_disturbance', name: 'Random disturbance' },
    observationMismatching: { source: 'suite', sourceKey: 'observation_mismatching', name: 'Observation mismatching' },
    memoryExploration: { source: 'suite', sourceKey: 'memory_exploration', name: 'Memory exploration' },
    memoryExecution: { source: 'suite', sourceKey: 'memory_execution', name: 'Memory execution' },
    mix: { source: 'suite', sourceKey: 'mix', name: 'Mix' },
  },
  minimum: 8,
});
