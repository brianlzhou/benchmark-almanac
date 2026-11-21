import {fireworksBoard} from '../lib/boards/fireworks.ts';
const board = fireworksBoard('nimble-web-context','web-search/web-context');
board.stats = { cost_per_task: { name: 'Cost per task', unit: 'usd', better: 'lower' }, duration_per_task: { name: 'Duration per task', unit: 'seconds', better: 'lower' } };
export default board;
