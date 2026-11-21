// Models predict the next desktop interface action. The score is the published step success rate.
// Score: step success rate (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/ui-vision.ts';
const board: Leaderboard = { benchmark: "ui-vision-action-prediction", parts: {
  typingCorrect: { name: 'Typing', group: 'Task type' },
  hotkeyCorrect: { name: 'Hotkey', group: 'Task type' },
}, stats: {
  clickMoveDistance: { name: 'Click or move distance', unit: 'score', better: 'lower' },
  clickMoveRecall: { name: 'Click or move recall', unit: '%', better: 'higher' },
  dragDistance: { name: 'Drag distance', unit: 'score', better: 'lower' },
  dragRecall: { name: 'Drag recall', unit: '%', better: 'higher' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Action prediction", "^Action prediction; step success;?\\s*") };
export default board;
