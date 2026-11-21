import {fireworksBoard} from '../lib/boards/fireworks.ts';
const board = fireworksBoard('cresta-bench','customer-support/cresta-bench');
board.stats = { cachedTokens: { name: 'Cached input tokens', unit: 'tokens' }, cost_per_task: { name: 'Cost per task', unit: 'usd', better: 'lower' }, duration_per_task: { name: 'Duration per task', unit: 'seconds', better: 'lower' }, k: { name: 'Attempt count', unit: 'count' }, recordedOutput: { name: 'Recorded output tokens', unit: 'tokens' }, uncachedInput: { name: 'Uncached input tokens', unit: 'tokens' } };
export default board;
