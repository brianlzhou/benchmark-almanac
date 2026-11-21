// Kinetics-700-2020 tests action recognition in videos. MTEB reports accuracy on a class-balanced sample of the official test split.
// The MTEB tasks use video alone or video with audio and distinguish classification from zero-shot classification.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {taskScores} from './aila-statute-retrieval.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const base='https://mteb-leaderboard-backend.hf.space/v1/tasks/';
const tasks=[
  ['Kinetics700V','Video classification',33],
  ['Kinetics700VA','Video and audio classification',16],
  ['Kinetics700VZeroShot','Zero-shot video classification',25],
  ['Kinetics700VAZeroShot','Zero-shot video and audio classification',16],
] as const;
const board:Leaderboard={
  benchmark:'kinetics-700-2020',host:'MTEB',url:'https://leaderboard.mteb.org/tasks/Kinetics700V',feed:base+'Kinetics700V/scores',
  terms:'CC0 1.0: https://huggingface.co/datasets/mteb/results',
  headline:'MTEB measures accuracy on its sample of the official test split, capped at about 16 clips per action class.',
  async fetch(){
    const rows:LeaderboardRow[]=[];
    for(const [task,setting,minimum] of tasks){
      if(rows.length) await new Promise(resolve=>setTimeout(resolve,1000));
      const result=await taskScores(base+task+'/scores',task,'accuracy',minimum,100);
      rows.push(...result.filter(r=>r.model!=='mteb/baseline-random-encoder').map(r=>({...r,setting})));
    }
    return checked(rows,90);
  },
};
export default board;
