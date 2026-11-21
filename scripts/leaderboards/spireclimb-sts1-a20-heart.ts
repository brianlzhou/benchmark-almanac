// Epoch's live run feed adds current models beyond the periodic archive.
import type { Leaderboard } from './types.ts';
import { epochRunRows,EPOCH_RUNS_FEED,EPOCH_SCORE_STATS } from '../lib/boards/epoch-runs.ts';
const board:Leaderboard={benchmark:'spireclimb-sts1-a20-heart',url:'https://epoch.ai/benchmarks/spireclimb',feed:EPOCH_RUNS_FEED,
 terms:'Epoch AI benchmark results are published under CC BY 4.0; Benchmark Almanac credits Epoch AI and links the source.', stats:{meanScore:EPOCH_SCORE_STATS.meanScore,'scorer:win_rate/all':EPOCH_SCORE_STATS['scorer:win_rate/all'],'scorerSpread:win_rate/all':EPOCH_SCORE_STATS['scorerSpread:win_rate/all']},
 fetch:()=>epochRunRows('SpireClimb (Slay the Spire 1, Ascension 20 Heart)')};
export default board;
