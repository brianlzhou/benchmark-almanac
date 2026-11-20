// FinSearchComp Greater China. The score is the published whole-market average accuracy (%); task scores stay metrics.
import { finsearchcompBoard } from '../lib/boards/finsearchcomp.ts';
const board = finsearchcompBoard("greater-china");
board.parts = {
  simpleHistorical: { name: 'Simple historical', group: 'Task type' },
  complexHistorical: { name: 'Complex historical', group: 'Task type' },
};
export default board;