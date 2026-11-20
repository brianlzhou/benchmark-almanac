// Fixed published track and version. Domain scores remain supporting metrics.
import { stateBoard } from '../lib/boards/microsoft-state.ts';
const board = stateBoard('state-bench-main-0-7-0','main','0.7.0');
board.parts = {
  'travel:passAt1': { name: 'Travel', group: 'Domain' },
  'customerSupport:passAt1': { name: 'Customer support', group: 'Domain' },
  'shoppingAssistant:passAt1': { name: 'Shopping assistant', group: 'Domain' },
};
export default board;