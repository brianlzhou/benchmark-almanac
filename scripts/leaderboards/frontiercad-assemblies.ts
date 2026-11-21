// Agents place supplied CAD parts into 16 assemblies. The score is the published mean assembly geometry score.
// Score: mean assembly geometry score. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/frontiercad.ts';
const board: Leaderboard = { benchmark: "frontiercad-assemblies", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 stats: {
  scheduled: { name: 'Scheduled tasks', unit: 'count' },
  scored: { name: 'Scored tasks', unit: 'count' },
  passRate: { name: 'Pass rate', unit: '%', better: 'higher' },
 },
 fetch: () => trackRows("^Assemblies;", "^Assemblies;\\s*") };
export default board;
