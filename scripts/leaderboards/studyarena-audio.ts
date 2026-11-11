import type { Leaderboard } from './types.ts';
import { studyRows, STUDY_TERMS } from '../lib/boards/studyarena.ts';
const board:Leaderboard={benchmark:"studyarena-audio",url:"https://studyarena.com/leaderboard/audio",feed:"https://studyarena.com/leaderboard/audio",terms:STUDY_TERMS,fetch:()=>studyRows('audio')};
export default board;
