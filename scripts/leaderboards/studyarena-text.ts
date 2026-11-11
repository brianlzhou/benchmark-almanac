import type { Leaderboard } from './types.ts';
import { studyRows, STUDY_TERMS } from '../lib/boards/studyarena.ts';
const board:Leaderboard={benchmark:"studyarena-text",url:"https://studyarena.com/leaderboard",feed:"https://studyarena.com/leaderboard",terms:STUDY_TERMS,fetch:()=>studyRows('text')};
export default board;
