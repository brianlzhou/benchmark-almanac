import {cekuraBoard} from '../lib/boards/cekura.ts';
const board = cekuraBoard('cekura-production','production');
board.parts = {
  'Humanness /5': { name: 'Humanness', group: 'Dimension' },
  'Voice tone /5': { name: 'Voice tone', group: 'Dimension' },
  'Interruption /5': { name: 'Interruption', group: 'Dimension' },
};
export default board;