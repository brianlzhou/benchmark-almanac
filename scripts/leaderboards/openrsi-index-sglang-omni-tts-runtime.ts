// Agents improve speech serving while preserving quality. The score is the official speedup reward for the archived continuation protocol.
// Score: official archived continuation reward. This archived result was not rerun under current protocol v5.
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-sglang-omni-tts-runtime", url: "https://index.openrsi.foundation/tasks/sglang-omni-tts-runtime.html", feed: "https://index.openrsi.foundation/tasks/sglang-omni-tts-runtime.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^SGLang Omni TTS Runtime;", "^SGLang Omni TTS Runtime;\\s*") };
export default board;
