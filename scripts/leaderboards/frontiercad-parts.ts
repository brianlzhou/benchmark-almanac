// Agents build 39 CAD parts from engineering drawings. The score is the published mean geometry score.
// Score: mean part geometry score. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/frontiercad.ts';
const board: Leaderboard = { benchmark: "frontiercad-parts", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 stats: {
  scheduled: { name: 'Scheduled tasks', unit: 'count' },
  scored: { name: 'Scored tasks', unit: 'count' },
  passRate: { name: 'Pass rate', unit: '%', better: 'higher' },
  tokenCoverage: { name: 'Token coverage', unit: '%' },
  turnCoverage: { name: 'Turn coverage', unit: '%' },
  meanTotalTokens: { name: 'Mean total tokens', unit: 'tokens', better: 'lower' },
  meanTurns: { name: 'Mean turns', unit: 'count', better: 'lower' },
  meanGeometry: { name: 'Mean geometry score', unit: 'score', better: 'higher' },
  meanEditability: { name: 'Mean editability score', unit: 'score', better: 'higher' },
 },
 fetch: () => trackRows("^Parts;", "^Parts;\\s*") };
export default board;
