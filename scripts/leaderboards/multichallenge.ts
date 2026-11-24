// MultiChallenge: both model-size tabs use the same conversations and percentage passed.
// Read both tabs so the small-model roster is retained alongside the large-model roster.
import { scaleRowsWithInterval as scaleRows } from './swe-bench-pro.ts';
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, scaleEntries, scaleFlight, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('multichallenge');

const board: Leaderboard = {
  benchmark: 'multichallenge',
  harnesses: 'system',
  reference: ['one-pass-agent'],
  url: PAGE,
  feed: `${PAGE} (large and small model tabs in Next.js flight data)`,
  terms: `${SCALE_TERMS} The almanac credits and links Scale's source.`,
  aliases: {
    ...SCALE_ALIASES,
    'gpt-5.1-2025-11-13-instant': 'gpt-5-1-instant',
    'gemini-2-0-flash': 'gemini-2-0-flash-feb-2025',
  },
  async fetch() {
    const flight = await scaleFlight(PAGE);
    return ['large', 'small'].flatMap(tab => scaleRows(scaleEntries(flight, tab), (_, entry) =>
      typeof entry.rank === 'number' ? { metrics: { [tab + 'ModelRank']: entry.rank } } : undefined));
  },
};
export default board;
