// Q-Bench Image-Pair Perception. The score is overall perception accuracy (%); question-category scores stay metrics.
import { qbenchBoard } from '../lib/boards/q-bench.ts';
const board = qbenchBoard("image-pair-perception");
board.parts = {
  'yes-or-no': { name: 'Yes or no', group: 'Task type' },
  what: { name: 'What', group: 'Task type' },
  how: { name: 'How', group: 'Task type' },
  distortion: { name: 'Distortion', group: 'Category' },
  others: { name: 'Others', group: 'Category' },
  compare: { name: 'Compare', group: 'Task type' },
  joint: { name: 'Joint', group: 'Task type' },
};
export default board;