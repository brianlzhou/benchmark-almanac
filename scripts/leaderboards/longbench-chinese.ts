// LongBench Chinese. The score is the original headline table’s Avg (%); task-family scores stay metrics.
import { longbenchBoard } from '../lib/boards/longbench.ts';
const board = longbenchBoard("chinese");
board.parts = {
  'Single-Doc QA': { name: 'Single document question answering', group: 'Task type' },
  'Multi-Doc QA': { name: 'Multiple document question answering', group: 'Task type' },
  Summarization: { name: 'Summarization', group: 'Task type' },
  'Few-shot Learning': { name: 'Few shot learning', group: 'Task type' },
  'Code Completion': { name: 'Code completion', group: 'Task type' },
  'Synthetic Tasks': { name: 'Synthetic tasks', group: 'Task type' },
};
export default board;