import type { Leaderboard } from './types.ts';
import { musicRows, MUSIC_TERMS } from '../lib/boards/music-arena-arenas.ts';
const board:Leaderboard={benchmark:'music-arena-vocal',url:'https://music-arena.org/',feed:'https://music-arena.org/ (Gradio Vocal table)',terms:MUSIC_TERMS,fetch:()=>musicRows('vocal')};
export default board;
