import { digBoard } from '../lib/boards/dig.ts';
const board = digBoard();
board.parts = {
  tier1: { name: 'Tier 1', group: 'Difficulty' },
  tier2: { name: 'Tier 2', group: 'Difficulty' },
  tier3: { name: 'Tier 3', group: 'Difficulty' },
  tier4: { name: 'Tier 4', group: 'Difficulty' },
  tier5: { name: 'Tier 5', group: 'Difficulty' },
  tier6: { name: 'Tier 6', group: 'Difficulty' },
  tier7: { name: 'Tier 7', group: 'Difficulty' },
};
export default board;