// Models read values and units from real instrument images. The score is the published overall measurement accuracy.
// Score: real-world overall accuracy (%). 
import type { Leaderboard } from './types.ts';
import { MEASUREBENCH_STATS, sourceBoard, trackRows } from '../lib/boards/measurebench.ts';
const board: Leaderboard = { benchmark: "measurebench-real-world", parts: {
  dial: { name: 'Dial', group: 'Category' },
  digital: { name: 'Digital', group: 'Category' },
  linear: { name: 'Linear', group: 'Category' },
  complex: { name: 'Complex', group: 'Category' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 stats: MEASUREBENCH_STATS,
 fetch: () => trackRows("^real-world$", "^real-world$") };
export default board;
