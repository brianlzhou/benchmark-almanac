// Each task produces one deck, so USD per deck is USD per task.
import { fireworksBoard } from '../lib/boards/fireworks.ts';
const board = fireworksBoard('genspark-slides-benchmark','slide-generation/genspark-slides-benchmark');
board.parts = {
  taskCompletion: { name: 'Task completion', group: 'Dimension' },
  contentQuality: { name: 'Content quality', group: 'Dimension' },
  visualDesign: { name: 'Visual design', group: 'Dimension' },
  processQuality: { name: 'Process quality', group: 'Dimension' },
};
export default board;