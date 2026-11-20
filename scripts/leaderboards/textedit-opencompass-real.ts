// Models edit text in real images in the full TextEdit test set. The score is the published judged average.
// Score: Full judged Avg. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/textedit-opencompass.ts';
const board: Leaderboard = { benchmark: "textedit-opencompass-real", parts: {
  TA: { name: 'Text accuracy', group: 'Dimension' },
  TP: { name: 'Text preservation', group: 'Dimension' },
  SI: { name: 'Scene integrity', group: 'Dimension' },
  LR: { name: 'Local realism', group: 'Dimension' },
  VC: { name: 'Visual coherence', group: 'Dimension' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Full; Real;", "^Full; Real; judged average$") };
export default board;
