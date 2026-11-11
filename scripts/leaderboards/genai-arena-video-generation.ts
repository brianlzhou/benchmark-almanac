import type { Leaderboard } from './types.ts';
import { GENAI_BASE, genaiRows } from '../lib/boards/genai-arenas.ts';
const board:Leaderboard={benchmark:"genai-arena-video-generation",url:'https://huggingface.co/spaces/TIGER-Lab/GenAI-Arena',feed:GENAI_BASE+'video_generation_leaderboard.csv',terms:'Public author-published CSV. Repository and Hugging Face terms apply. The almanac credits and links the source.',fetch:()=>genaiRows('video_generation')};
export default board;
