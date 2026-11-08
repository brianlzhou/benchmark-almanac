// Agents adjust retrieval training data schedules. The score measures reasoning retrieval with a penalty for general retrieval regression.
// Score: penalized reasoning retrieval score. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-reasonir-curriculum", url: "https://index.openrsi.foundation/tasks/reasonir-difficulty-curriculum.html", feed: "https://index.openrsi.foundation/tasks/reasonir-difficulty-curriculum.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "score"}},
 fetch: () => trackRows("^ReasonIR\\ Difficulty\\ Curriculum;", "^ReasonIR\\ Difficulty\\ Curriculum;\\s*") };
export default board;
