// FrontierCode 2.0 publishes adjusted accuracy, raw pass rate, flagged rate and the size of the main set.
import { makeFrontierCode } from '../lib/boards/frontiercode.ts';

const board = makeFrontierCode({
  benchmark: 'frontiercode-2-0',
  url: 'https://cognition.com/frontiercode',
  path: '/data/frontier-code-2.0/data.json',
  metrics: true,
});
board.stats = {
  passRate: { name: 'Pass rate', unit: '%', better: 'higher' },
};
export default board;
