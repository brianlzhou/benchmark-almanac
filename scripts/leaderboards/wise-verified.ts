// WISE_Verified changes prompts, judge and scoring. Coordinator must migrate Verified rows from wise-t2i.
import board from './wise-t2i.ts';
export default {...board, benchmark:'wise-verified'};
