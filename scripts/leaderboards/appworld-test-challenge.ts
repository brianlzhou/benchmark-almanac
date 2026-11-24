// AppWorld Test-Challenge. The score is whole-split task-goal completion (%); difficulty scores stay metrics.
import { appworldBoard } from '../lib/boards/appworld.ts';
const board = appworldBoard("test-challenge");
board.parts = {
  level1: { name: 'Level 1', group: 'Difficulty' },
  level2: { name: 'Level 2', group: 'Difficulty' },
  level3: { name: 'Level 3', group: 'Difficulty' },
};
board.chart = {
  title: 'Test-Challenge task goal completion versus interactions',
  x: { key: 'interactions', label: 'Average interactions per task', better: 'lower' },
  y: { key: 'score', label: 'Task goal completion', unit: '%', better: 'higher' },
  note: 'The AppWorld leaderboard plots task goal completion against average code execution interactions per task.',
};
export default board;