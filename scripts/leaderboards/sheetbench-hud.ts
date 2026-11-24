import { fireworksBoard } from '../lib/boards/fireworks.ts';
const board = fireworksBoard('sheetbench-hud','finance/sheetbench');
board.stats = {
  cost_per_task: { name: 'Cost per task', unit: 'usd', better: 'lower' },
  duration_per_task: { name: 'Duration per task', unit: 'seconds', better: 'lower' },
  k: { name: 'Attempt budget', unit: 'count' },
  uncachedInput: { name: 'Uncached input tokens per task', unit: 'tokens' },
  cachedTokens: { name: 'Cached tokens', unit: 'tokens', note: 'Total cached input tokens across the evaluation run.' },
  recordedOutput: { name: 'Output tokens', unit: 'tokens', note: 'Total output tokens recorded across the evaluation run.' },
};
export default board;
