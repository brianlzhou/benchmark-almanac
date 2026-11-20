// Models locate interface elements from instructions. The score is the published overall grounding accuracy.
// Score: Final Avg accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/ui-vision.ts';
const board: Leaderboard = { benchmark: "ui-vision-element-grounding", parts: {
  basic: { name: 'Basic', group: 'Task type' },
  functional: { name: 'Functional', group: 'Task type' },
  spatial: { name: 'Spatial', group: 'Task type' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Element grounding$", "^.*$") };
export default board;
