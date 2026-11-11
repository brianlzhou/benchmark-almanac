import type { Leaderboard } from './types.ts';
import { epochCov1Rows, EPOCH_COV1_FEED } from '../lib/boards/epoch-cov1.ts';
const board:Leaderboard={benchmark:'spireclimb-sts2-a10',url:'https://epoch.ai/benchmarks/spireclimb',feed:EPOCH_COV1_FEED,
 terms:'Epoch publishes these benchmark runs; the Almanac credits Epoch and links the source.',
 fetch:()=>epochCov1Rows('SpireClimb (Slay the Spire 2, Ascension 10)')};
export default board;
