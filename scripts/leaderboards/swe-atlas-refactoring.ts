// SWE Atlas Refactoring: Scale's board has one table. The score is the task resolve rate in percent (the
// refactor must pass the tests and the rubrics). Names carry the harness and effort.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('sweatlas-refactoring');

const board: Leaderboard = {
  benchmark: 'swe-atlas-refactoring',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: 'Scale terms restrict automated extraction. The almanac credits Scale AI and links the source.',
  aliases: {
    ...SCALE_ALIASES,
    // "GPT 5.3 (Codex)": GPT-5.3-Codex in the Codex harness, as on the SWE Atlas Codebase QnA board
    'GPT 5.3': 'gpt-5-3-codex',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
