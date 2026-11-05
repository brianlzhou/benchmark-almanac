// ARC-AGI-3 on the ARC Prize leaderboard: the same per-version JSON file as ARC-AGI-2. Each model has a
// standard-harness run and, for newer models, a "Provider Adapter" run; both are kept, named in `harness`.
// The file's `cost` is the US dollars of the whole run (from about $200 to $50,000), not a cost per task as on
// ARC-AGI-1 and 2, so the board says so in `costPer`.
import type { Leaderboard } from './types.ts';
import { arcFeed, arcRows } from './arc-agi-2.ts';

const board: Leaderboard = {
  benchmark: 'arc-agi-3',
  url: 'https://arcprize.org/leaderboard',
  feed: arcFeed('v3'),
  terms: 'Public JSON file the ARC Prize leaderboard page loads; robots.txt allows all paths.',
  aliases: {
    'Anthropic Opus 4.6': 'claude-opus-4-6',
    'Gemini 3.1 Pro (Preview)': 'gemini-3-1-pro',
  },
  costPer: 'run',
  fetch: () => arcRows('v3'),
};
export default board;
