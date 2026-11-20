// Models answer explicit requests during audio and video streams. The score is the published average across tasks T1 through T7.
// Score: explicit-request Avg. (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/omni-interactscope.ts';
const board: Leaderboard = { benchmark: "omni-interactscope-explicit-request", parts: {
  T1: { name: 'Tool invocation', group: 'Task type' },
  T2: { name: 'Event notification', group: 'Task type' },
  T3: { name: 'Risk and error interjection', group: 'Task type' },
  T4: { name: 'Cumulative-state tracking', group: 'Task type' },
  T6: { name: 'Nonverbal and workflow cues', group: 'Task type' },
  T7: { name: 'Continuous responses', group: 'Task type' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Explicit request", "^Explicit request;\\s*") };
export default board;
