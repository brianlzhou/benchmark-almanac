// Models generate unit tests for repositories. The score is the published oracle-test percentage.
// Score: unit oracle test (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/devbench.ts';
const board: Leaderboard = { benchmark: "devbench-unit-testing", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 stats: {
  coverageAll: { name: 'Test coverage (all repos)', unit: '%', better: 'higher', note: 'Uniformly weighted average across all repositories.' },
  coverageValid: { name: 'Test coverage (valid repos)', unit: '%', better: 'higher', note: 'Average across repositories with executable generated tests.' },
 },
 fetch: () => trackRows("^Unit oracle test$", "^.*$") };
export default board;
