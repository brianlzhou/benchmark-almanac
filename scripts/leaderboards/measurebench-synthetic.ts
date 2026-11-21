// Models read values and units from generated instrument images. The score is the published overall measurement accuracy.
// Score: synthetic overall accuracy (%). 
import type { Leaderboard } from './types.ts';
import { MEASUREBENCH_STATS, sourceBoard, trackRows } from '../lib/boards/measurebench.ts';
const board: Leaderboard = { benchmark: "measurebench-synthetic", parts: {
  dial: { name: 'Dial', group: 'Modality' },
  digital: { name: 'Digital', group: 'Modality' },
  linear: { name: 'Linear', group: 'Modality' },
  complex: { name: 'Complex', group: 'Modality' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 stats: MEASUREBENCH_STATS,
 fetch: () => trackRows("^synthetic$", "^synthetic$") };
export default board;
