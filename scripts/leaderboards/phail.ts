// PhAIL (Positronic Robotics), the original Pick and Place benchmark. The board launched on 2026-03-31
// with a throughput metric; phail.ai now ranks the task by Reliability (% items placed) in the Pick and
// Place column of its home table, which is the score here. Read through phailRows in
// phail-droid-everyday.ts.
import type { Leaderboard } from './types.ts';
import { PHAIL_PAGE, PHAIL_TERMS, phailRows } from './phail-droid-everyday.ts';

const board: Leaderboard = {
  benchmark: 'phail',
  url: PHAIL_PAGE,
  feed: `${PHAIL_PAGE} (server-rendered table, "Pick and Place" Reliability)`,
  terms: PHAIL_TERMS,
  aliases: {
    // the model page lists GR00T N1.6 as the base model fine-tuned for this task
    'GR00T': 'gr00t-n1-6',
  },
  fetch: () => phailRows('Pick and Place', true),
};
export default board;
