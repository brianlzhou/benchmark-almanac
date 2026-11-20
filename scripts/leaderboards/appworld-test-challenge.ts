// AppWorld Test-Challenge. The score is whole-split task-goal completion (%); difficulty scores stay metrics.
import { appworldBoard } from '../lib/boards/appworld.ts';
const board = appworldBoard("test-challenge");
board.parts = {
  level1: { name: 'Level 1', group: 'Difficulty' },
  level2: { name: 'Level 2', group: 'Difficulty' },
  level3: { name: 'Level 3', group: 'Difficulty' },
};
export default board;