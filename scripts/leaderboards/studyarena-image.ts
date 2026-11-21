import type { Leaderboard } from './types.ts';
import { studyRows, STUDY_TERMS, STUDY_STATS } from '../lib/boards/studyarena.ts';
const board:Leaderboard={benchmark:"studyarena-image",url:"https://studyarena.com/leaderboard/image",feed:"https://studyarena.com/leaderboard/image",terms:STUDY_TERMS,stats:STUDY_STATS,fetch:()=>studyRows('image')};
export default board;
