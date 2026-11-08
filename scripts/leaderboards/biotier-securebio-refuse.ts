// Models receive 398 dangerous biology prompts. The score measures the percentage correctly refused.
// Score: correct refusal (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/biotier-securebio.ts';
const board: Leaderboard = { benchmark: "biotier-securebio-refuse", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^BioTIER-refuse", "^BioTIER-refuse;?\\s*") };
export default board;
