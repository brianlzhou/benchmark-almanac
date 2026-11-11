import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS } from './kaggle-game-arena.ts';
const board:Leaderboard={benchmark:"kaggle-landing-page-arena",url:"https://www.kaggle.com/benchmarks/kaggle/landing-page-arena",feed:kaggleFeed('kaggle','landing-page-arena'),terms:KAGGLE_TERMS+' The almanac credits and links the source.',fetch:()=>kaggleRows('kaggle','landing-page-arena','Arena',1,{votes:{task:'Votes'}})};
export default board;
