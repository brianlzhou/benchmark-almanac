// Remote Labor Index: Scale's board has one table. The score is the Automation Rate in percent: the share of
// projects whose deliverable reviewers judge at or above the commissioned standard. Elo, dollars earned and cost
// savings appear only in the page's text. A few names carry a harness ("(CoWork)", "Codex GPT 5.5").
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('rli');

const board: Leaderboard = {
  benchmark: 'remote-labor-index',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS + " The Almanac credits Scale and links the source leaderboard.",
  aliases: {
    ...SCALE_ALIASES,
    'Gemini Argon 4': 'gemini-4-argon',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
