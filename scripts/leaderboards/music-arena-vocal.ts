import type { Leaderboard } from './types.ts';
import { musicRows, MUSIC_TERMS, MUSIC_STATS } from '../lib/boards/music-arena.ts';
const board:Leaderboard={benchmark:'music-arena-vocal',url:'https://music-arena.org/',feed:'https://music-arena.org/ (Gradio Vocal table)',terms:MUSIC_TERMS,stats:MUSIC_STATS,fetch:()=>musicRows('vocal')};
export default board;
