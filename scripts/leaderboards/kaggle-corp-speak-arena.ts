import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS } from './kaggle-game-arena.ts';
const board:Leaderboard={benchmark:"kaggle-corp-speak-arena",url:"https://www.kaggle.com/benchmarks/kaggle/corp-speak-arena",feed:kaggleFeed('kaggle','corp-speak-arena'),terms:KAGGLE_TERMS+' The almanac credits and links the source.',fetch:()=>kaggleRows('kaggle','corp-speak-arena','Arena',1,{votes:{task:'Votes'}})};
export default board;
