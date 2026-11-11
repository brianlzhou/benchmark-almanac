import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS } from './kaggle-game-arena.ts';
const board:Leaderboard={benchmark:"code2video-arena",url:"https://www.kaggle.com/benchmarks/heygen/code2video-arena",feed:kaggleFeed('heygen','code2video-arena'),terms:KAGGLE_TERMS+' The almanac credits and links the source.',fetch:()=>kaggleRows('heygen','code2video-arena','Arena',1,{votes:{task:'Votes'}})};
export default board;
