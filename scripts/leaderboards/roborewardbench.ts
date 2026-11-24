// RoboRewardBench (Stanford). The board is a HELM project that publishes run suites only
// (robo-reward-bench/benchmark_output/runs/<version>). Its headline is "Mean Abs. Error (↓ better)" in the
// Accuracy table of core_scenarios.json: the mean absolute error of the model's predicted episode reward
// (on a discrete scale) across the robot datasets, so lower is better. Read through helmRows in
// helm-capabilities.ts, which takes the model from each row's run spec.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'robo-reward-bench', kind: 'runs', group: 'core_scenarios', table: 'Accuracy', column: 'Mean Abs. Error (↓ better)', scenarioParts: 'raw' };

const board: Leaderboard = {
  benchmark: 'roborewardbench',
  url: 'https://crfm.stanford.edu/helm/robo-reward-bench/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  parts: {
    'RoboArena - Absolute Error': { name: 'RoboArena', group: 'Dataset' },
    'Austin Sirius - Absolute Error': { name: 'Austin Sirius', group: 'Dataset' },
    'Berkeley Autolab UR5 - Absolute Error': { name: 'Berkeley Autolab UR5', group: 'Dataset' },
    'Berkeley Fanuc Manipulation - Absolute Error': { name: 'Berkeley Fanuc Manipulation', group: 'Dataset' },
    'Berkeley MVP - Absolute Error': { name: 'Berkeley MVP', group: 'Dataset' },
    'Berkeley RPT - Absolute Error': { name: 'Berkeley RPT', group: 'Dataset' },
    'Berkeley Bridge - Absolute Error': { name: 'Berkeley Bridge', group: 'Dataset' },
    'CMU Play Fusion - Absolute Error': { name: 'CMU Play Fusion', group: 'Dataset' },
    'DLR Wheelchair Shared Control - Absolute Error': { name: 'DLR Wheelchair Shared Control', group: 'Dataset' },
    'DROID - Absolute Error': { name: 'DROID', group: 'Dataset' },
    'RT-1 Robot Action - Absolute Error': { name: 'RT-1 Robot Action', group: 'Dataset' },
    'CMU Franka Pick-Insert - Absolute Error': { name: 'CMU Franka Pick-Insert', group: 'Dataset' },
    'USC Jaco Play - Absolute Error': { name: 'USC Jaco Play', group: 'Dataset' },
    'KAIST Nonprehensile Objects - Absolute Error': { name: 'KAIST Nonprehensile Objects', group: 'Dataset' },
    'Roboturk - Absolute Error': { name: 'RoboTurk', group: 'Dataset' },
    'Stanford HYDRA - Absolute Error': { name: 'Stanford HYDRA', group: 'Dataset' },
    'Freiburg Franka Play - Absolute Error': { name: 'Freiburg Franka Play', group: 'Dataset' },
    'LSMO - Absolute Error': { name: 'LSMO', group: 'Dataset' },
    'UCSD Kitchen - Absolute Error': { name: 'UCSD Kitchen', group: 'Dataset' },
    'UCSD Pick Place - Absolute Error': { name: 'UCSD Pick Place', group: 'Dataset' },
    'Tokyo PR2 Tabletop Manipulation - Absolute Error': { name: 'Tokyo PR2 Tabletop Manipulation', group: 'Dataset' },
    'UTokyo xArm Bimanual - Absolute Error': { name: 'UTokyo xArm Bimanual', group: 'Dataset' },
    'Austin VIOLA - Absolute Error': { name: 'Austin VIOLA', group: 'Dataset' },
  },
  fetch: () => helmRows(TABLE),
};
export default board;
