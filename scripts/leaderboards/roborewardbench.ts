// RoboRewardBench (Stanford). The board is a HELM project that publishes run suites only
// (robo-reward-bench/benchmark_output/runs/<version>). Its headline is "Mean Abs. Error (↓ better)" in the
// Accuracy table of core_scenarios.json: the mean absolute error of the model's predicted episode reward
// (on a discrete scale) across the robot datasets, so lower is better. Read through helmRows in
// helm-capabilities.ts, which takes the model from each row's run spec.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'robo-reward-bench', kind: 'runs', group: 'core_scenarios', table: 'Accuracy', column: 'Mean Abs. Error (↓ better)' };

const board: Leaderboard = {
  benchmark: 'roborewardbench',
  url: 'https://crfm.stanford.edu/helm/robo-reward-bench/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
