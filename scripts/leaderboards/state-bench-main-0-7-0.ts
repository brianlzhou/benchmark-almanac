// The headline is pass@1. The feed also reports pass@5.
// Fixed published track and version. Domain scores remain supporting metrics.
import { stateBoard } from '../lib/boards/microsoft-state.ts';
const board = stateBoard('state-bench-main-0-7-0','main','0.7.0');
board.parts = {
  'travel:passAt1': { name: 'Travel', group: 'Domain' },
  'customerSupport:passAt1': { name: 'Customer support', group: 'Domain' },
  'shoppingAssistant:passAt1': { name: 'Shopping assistant', group: 'Domain' },
};
board.stats = {
  ux: { name: 'User experience rating', unit: 'score', better: 'higher' },
  passAt1: { name: 'Pass@1', unit: '%', better: 'higher' },
  passAt5: { name: 'Pass@5', unit: '%', better: 'higher' },
  meanUxScore: { name: 'Mean user experience score', unit: 'score', better: 'higher' },
  costPerTask: { name: 'Cost per task', unit: 'usd', better: 'lower' },
  'travel:passAt5': { name: 'Travel pass@5', unit: '%', better: 'higher' },
  'travel:meanUxScore': { name: 'Travel mean user experience score', unit: 'score', better: 'higher' },
  'travel:costPerTask': { name: 'Travel cost per task', unit: 'usd', better: 'lower' },
  'customerSupport:passAt5': { name: 'Customer support pass@5', unit: '%', better: 'higher' },
  'customerSupport:meanUxScore': { name: 'Customer support mean user experience score', unit: 'score', better: 'higher' },
  'customerSupport:costPerTask': { name: 'Customer support cost per task', unit: 'usd', better: 'lower' },
  'shoppingAssistant:passAt5': { name: 'Shopping assistant pass@5', unit: '%', better: 'higher' },
  'shoppingAssistant:meanUxScore': { name: 'Shopping assistant mean user experience score', unit: 'score', better: 'higher' },
  'shoppingAssistant:costPerTask': { name: 'Shopping assistant cost per task', unit: 'usd', better: 'lower' },
};
export default board;
