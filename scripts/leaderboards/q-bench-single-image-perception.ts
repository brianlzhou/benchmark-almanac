// Q-Bench Single-Image Perception. The score is overall perception accuracy (%); question-category scores stay metrics.
import { qbenchBoard } from '../lib/boards/q-bench.ts';
const board = qbenchBoard("single-image-perception");
board.parts = {
  'yes-or-no': { name: 'Yes or no', group: 'Question type' },
  what: { name: 'What', group: 'Question type' },
  how: { name: 'How', group: 'Question type' },
  distortion: { name: 'Distortion', group: 'Category' },
  others: { name: 'Others', group: 'Category' },
  'in-context distortion': { name: 'In-context distortion', group: 'Category' },
  'in-context others': { name: 'In-context others', group: 'Category' },
};
export default board;