import type { Leaderboard } from './types.ts';
import { GENAI_BASE, GENAI_STATS, genaiRows } from '../lib/boards/genai-arena.ts';
const board:Leaderboard={benchmark:"genai-arena-video-generation",url:'https://huggingface.co/spaces/TIGER-Lab/GenAI-Arena',feed:GENAI_BASE+'video_generation_leaderboard.csv',terms:'Public author-published CSV. Repository and Hugging Face terms apply. The almanac credits and links the source.',stats:GENAI_STATS,fetch:()=>genaiRows('video_generation')};
export default board;
