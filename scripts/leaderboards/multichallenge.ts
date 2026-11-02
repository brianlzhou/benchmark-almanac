// MultiChallenge: Scale's board, read from the "large" tab (MultiChallenge (Large Language Models)), the tab the
// page opens on. The "small" tab lists small models. The score is the share of conversations passed, in percent.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('multichallenge');
const TAB = 'large';

const board: Leaderboard = {
  benchmark: 'multichallenge',
  url: PAGE,
  feed: scaleFeed(PAGE, TAB),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE, TAB)),
};
export default board;
