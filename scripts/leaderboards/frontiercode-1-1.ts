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
board.stats = {
  passRate: { name: 'Raw pass rate', unit: '%', better: 'higher' },
  latency: { name: 'Duration', unit: 'seconds', better: 'lower' },
  toolCalls: { name: 'Tool calls', unit: 'count', better: 'lower' },
  ote: { name: 'Output-token equivalent', unit: 'tokens', better: 'lower' },
  shortcutRateV1: { name: 'V1 shortcut rate', unit: '%', better: 'lower' },
  tokensV1: { name: 'V1 output tokens', unit: 'tokens', better: 'lower' },
  extended_passRate: { name: 'Extended raw pass rate', unit: '%', better: 'higher' },
  extended_latency: { name: 'Extended duration', unit: 'seconds', better: 'lower' },
  extended_toolCalls: { name: 'Extended tool calls', unit: 'count', better: 'lower' },
  extended_ote: { name: 'Extended output-token equivalent', unit: 'tokens', better: 'lower' },
  extended_shortcutRateV1: { name: 'Extended V1 shortcut rate', unit: '%', better: 'lower' },
  extended_tokensV1: { name: 'Extended V1 output tokens', unit: 'tokens', better: 'lower' },
  extended_cost: { name: 'Extended cost per task', unit: 'usd', better: 'lower' },
  extended_tokens: { name: 'Extended output tokens', unit: 'tokens', better: 'lower' },
};
export default board;
