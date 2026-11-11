import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS } from './kaggle-game-arena.ts';
const board:Leaderboard={benchmark:"kaggle-joke-arena",url:"https://www.kaggle.com/benchmarks/kaggle/joke-arena",feed:kaggleFeed('kaggle','joke-arena'),terms:KAGGLE_TERMS+' The almanac credits and links the source.',fetch:()=>kaggleRows('kaggle','joke-arena','Arena',1,{votes:{task:'Votes'}})};
export default board;
