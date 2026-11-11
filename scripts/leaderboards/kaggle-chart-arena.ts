import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS } from './kaggle-game-arena.ts';
const board:Leaderboard={benchmark:"kaggle-chart-arena",url:"https://www.kaggle.com/benchmarks/kaggle/chart-arena",feed:kaggleFeed('kaggle','chart-arena'),terms:KAGGLE_TERMS+' The almanac credits and links the source.',fetch:()=>kaggleRows('kaggle','chart-arena','Arena',1,{votes:{task:'Votes'}})};
export default board;
