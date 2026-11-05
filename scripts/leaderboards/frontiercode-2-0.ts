// FrontierCode 2.0 (blog post 2026-10-27), the current board at cognition.com/frontiercode. The reader
// lives in frontiercode.ts. The 2.0 file fills only "correct" among the chart numbers, kept as metrics.passRate
// (the raw pass rate before the shortcut penalty); its time, tool-call and OTE fields are empty.
import { makeFrontierCode } from './frontiercode.ts';

export default makeFrontierCode({
  benchmark: 'frontiercode-2-0',
  url: 'https://cognition.com/frontiercode',
  path: '/data/frontier-code-2.0/data.json',
  metrics: true,
});
