// Models transcribe speech from Moonshot internal subset 2. The score is the published word error rate.
// Score: word error rate (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/kimi-asr-internal-moonshot.ts';
const board: Leaderboard = { benchmark: "kimi-asr-internal-moonshot-subset2", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^subset2$", "^.*$") };
export default board;
