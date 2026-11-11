import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS } from './kaggle-game-arena.ts';
const board:Leaderboard={benchmark:'kaggle-floorplan-arena',url:'https://www.kaggle.com/benchmarks/kaggle/floorplan-arena',feed:kaggleFeed('kaggle','floorplan-arena'),terms:KAGGLE_TERMS+' The almanac credits and links the source.',fetch:()=>kaggleRows('kaggle','floorplan-arena','Arena',1,{votes:{task:'Votes'}})};
export default board;
