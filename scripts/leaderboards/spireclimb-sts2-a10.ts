import type { Leaderboard } from './types.ts';
import { epochRunRows, EPOCH_RUNS_FEED } from '../lib/boards/epoch-runs.ts';
const board:Leaderboard={benchmark:'spireclimb-sts2-a10',url:'https://epoch.ai/benchmarks/spireclimb',feed:EPOCH_RUNS_FEED,
 terms:'Epoch publishes these benchmark runs; the Almanac credits Epoch and links the source.',
 fetch:()=>epochRunRows('SpireClimb (Slay the Spire 2, Ascension 10)')};
export default board;
