// Full 101-task pass rate. Difficulty subsets use separate candidates.
import {mbaBoard} from '../lib/boards/mbabench.ts';
const board = mbaBoard('mbabench-2');
board.parts = {
  numericalAccuracy: { name: 'Numerical accuracy', group: 'Dimension' },
};
board.stats = {
  passed: { name: 'Passed tasks', unit: 'count' },
  tasks: { name: 'Tasks', unit: 'count' },
  accuracyStandardError: { name: 'Numerical accuracy standard error', unit: 'score' },
};
export default board;
