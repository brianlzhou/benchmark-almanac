import type { Leaderboard } from './types.ts';
import { studyRows, STUDY_TERMS } from '../lib/boards/studyarena-arenas.ts';
const board:Leaderboard={benchmark:"studyarena-image",url:"https://studyarena.com/leaderboard/image",feed:"https://studyarena.com/leaderboard/image",terms:STUDY_TERMS,fetch:()=>studyRows('image')};
export default board;
