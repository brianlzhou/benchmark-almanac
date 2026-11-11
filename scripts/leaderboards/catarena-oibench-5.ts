import type { Leaderboard } from './types.ts';
import { CAT_FEED, CAT_TERMS, catRows } from '../lib/boards/catarena.ts';
const board:Leaderboard={benchmark:"catarena-oibench-5",url:'https://catarena.ai/leaderboard',feed:CAT_FEED,terms:CAT_TERMS,aliases:{'Claude 4 Sonnet':'claude-sonnet-4','Claude 3.7_Sonnet':'claude-3-7-sonnet'},fetch:()=>catRows("oibench_5","Time AUC")};
export default board;
