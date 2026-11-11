import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS } from './kaggle-game-arena.ts';
const board:Leaderboard={benchmark:"kaggle-eli5-arena",url:"https://www.kaggle.com/benchmarks/kaggle/eli5-arena",feed:kaggleFeed('kaggle','eli5-arena'),terms:KAGGLE_TERMS+' The almanac credits and links the source.',fetch:()=>kaggleRows('kaggle','eli5-arena','Arena',1,{votes:{task:'Votes'}})};
export default board;
