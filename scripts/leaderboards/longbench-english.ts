// LongBench English. The score is the original headline table’s Avg (%); task-family scores stay metrics.
import { longbenchBoard } from '../lib/boards/longbench.ts';
const board = longbenchBoard("english");
board.parts = {
  'Single-Doc QA': { name: 'Single document QA', group: 'Task type' },
  'Multi-Doc QA': { name: 'Multiple document QA', group: 'Task type' },
  Summarization: { name: 'Summarization', group: 'Task type' },
  'Few-shot Learning': { name: 'Few-shot learning', group: 'Task type' },
  'Code Completion': { name: 'Code completion', group: 'Task type' },
  'Synthetic Tasks': { name: 'Synthetic tasks', group: 'Task type' },
};
export default board;