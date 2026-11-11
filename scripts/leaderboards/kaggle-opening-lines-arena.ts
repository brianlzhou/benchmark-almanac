import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS } from './kaggle-game-arena.ts';
const board:Leaderboard={benchmark:"kaggle-opening-lines-arena",url:"https://www.kaggle.com/benchmarks/kaggle/opening-lines-arena",feed:kaggleFeed('kaggle','opening-lines-arena'),terms:KAGGLE_TERMS+' The almanac credits and links the source.',fetch:()=>kaggleRows('kaggle','opening-lines-arena','Arena',1,{votes:{task:'Votes'}})};
export default board;
