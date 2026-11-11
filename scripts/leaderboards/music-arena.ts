// Music Arena's default Instrumental leaderboard. The Vocal pool has its own proposed record.
// A catalog patch names this scope explicitly; no pooled instrumental/vocal rating is published.
import type { Leaderboard } from './types.ts';
import { musicRows, MUSIC_TERMS } from '../lib/boards/music-arena-arenas.ts';
const board: Leaderboard = {
  benchmark:'music-arena', url:'https://music-arena.org/',
  feed:'https://music-arena.org/ (Gradio Instrumental leaderboard)', terms:MUSIC_TERMS,
  fetch:()=>musicRows('instrumental'),
};
export default board;
