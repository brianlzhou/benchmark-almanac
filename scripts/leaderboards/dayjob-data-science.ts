import { fireworksBoard } from '../lib/boards/fireworks.ts';
const board = fireworksBoard('dayjob-data-science','data-science/dayjob-data-science');
board.stats = { cachedTokens: { name: 'Cached input tokens', unit: 'tokens' }, cost_per_task: { name: 'Cost per task', unit: 'usd', better: 'lower' }, reasoningTokens: { name: 'Reasoning tokens', unit: 'tokens' }, recordedOutput: { name: 'Recorded output tokens', unit: 'tokens' }, uncachedInput: { name: 'Uncached input tokens', unit: 'tokens' } };
export default board;
