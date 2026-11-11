import type { Leaderboard } from './types.ts';
import { CAT_FEED, CAT_TERMS, catRows } from '../lib/boards/catarena.ts';
const board:Leaderboard={benchmark:"catarena-swe-perf-10",url:'https://catarena.ai/leaderboard',feed:CAT_FEED,terms:CAT_TERMS,aliases:{'Claude 4 Sonnet':'claude-sonnet-4','Claude 3.7_Sonnet':'claude-3-7-sonnet'},fetch:()=>catRows("swe_perf_10","Time Ratio")};
export default board;
