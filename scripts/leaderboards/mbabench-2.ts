// Full 101-task pass rate. Difficulty subsets use separate candidates.
import {mbaBoard} from '../lib/boards/mbabench.ts';
const board = mbaBoard('mbabench-2');
board.parts = {
  numericalAccuracy: { name: 'Numerical accuracy', group: 'Dimension' },
};
export default board;