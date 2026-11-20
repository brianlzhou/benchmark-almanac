// Models solve spatial placement questions in the RefSpatial expansion set. The score is the published overall accuracy.
// Score: published Overall accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/refspatial-expand-bench.ts';
const board: Leaderboard = { benchmark: "refspatial-expand-bench-placement", parts: {
  Indoor: { name: 'Indoor', group: 'Environment' },
  Outdoor: { name: 'Outdoor', group: 'Environment' },
  Step1: { name: 'Step 1', group: 'Difficulty' },
  Step2: { name: 'Step 2', group: 'Difficulty' },
  Step3: { name: 'Step 3', group: 'Difficulty' },
  Step4: { name: 'Step 4', group: 'Difficulty' },
  Step5: { name: 'Step 5', group: 'Difficulty' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Placement$", "^.*$") };
export default board;
