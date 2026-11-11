// Models implement repository code. The score is the acceptance-test pass rate, with unit-test pass rate as an auxiliary metric.
// Score: acceptance-test pass rate (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/devbench.ts';
const board: Leaderboard = { benchmark: "devbench-implementation", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Implementation acceptance pass$", "^.*$") };
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => r.model === 'GPT-3.5-Turbo' ? {...r, model: r.model + ' (snapshot unspecified)'} : r);
board.aliases = {...board.aliases, 'GPT-4-Turbo-1106': 'gpt-4-turbo-nov-2023', 'GPT-4-Turbo-0125': 'gpt-4-turbo-jan-2024'};
export default board;
