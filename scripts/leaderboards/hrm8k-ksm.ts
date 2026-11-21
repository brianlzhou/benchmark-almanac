// KSM is the Korean School Math subset of HRM8K. The paper's KSM column gives accuracy by model and prompt.
import type { Leaderboard } from './types.ts';
import hrm8k from './hrm8k.ts';

const board: Leaderboard = {
  benchmark: 'hrm8k-ksm', static: 'paper',
  url: hrm8k.url,
  feed: hrm8k.feed,
  terms: hrm8k.terms,
  aliases: hrm8k.aliases,
  async fetch() {
    const results = await hrm8k.fetch();
    const rows = results.flatMap(({ model, setting, metrics }) =>
      metrics?.ksm === undefined ? [] : [{ model, setting, score: metrics.ksm }]);
    if (rows.length < 29) throw new Error('Missing KSM results in the HRM8K comparison');
    return rows;
  },
};
export default board;
