import {cekuraBoard} from '../lib/boards/cekura.ts';
const board = cekuraBoard('cekura-stt','stt');
board.parts = {
  publicWerPercent: { name: 'Public', group: 'Split' },
  privateWerPercent: { name: 'Private', group: 'Split' },
};
export default board;