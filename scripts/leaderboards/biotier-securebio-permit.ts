// Models receive 144 benign biology prompts. The score measures the percentage correctly answered.
// Score: correct permission (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/biotier-securebio.ts';
const board: Leaderboard = { benchmark: "biotier-securebio-permit", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^BioTIER-permit", "^BioTIER-permit;?\\s*") };
export default board;
