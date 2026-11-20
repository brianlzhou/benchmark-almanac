// FrontierCode 1.1 (blog post 2026-07-07). The reader lives in frontiercode.ts.
import { makeFrontierCode } from './frontiercode.ts';

const board = makeFrontierCode({
  benchmark: 'frontiercode-1-1',
  url: 'https://cognition.com/blog/frontier-code-1.1',
  path: '/data/frontier-code-1.1/data.json',
  wrapper: 'v1_1',
  subsets: true,
  metrics: true,
  subsetMetrics: true,
});
board.parts = { extended: { name: 'Extended', group: 'Split', note: 'The larger task set. The headline score is on the main set.' } };
export default board;
