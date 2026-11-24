import type {Leaderboard} from './types.ts';
import {EPOCH_RUNS_FEED,EPOCH_SCORE_STATS,epochRunRows} from '../lib/boards/epoch-runs.ts';
const board:Leaderboard={benchmark:'furniture-assembly-benchmark',url:'https://epoch.ai/benchmarks/furniture-assembly',feed:EPOCH_RUNS_FEED,
terms:'Epoch AI publishes its benchmark data under CC BY 4.0. The almanac credits and links Epoch AI.',stats: EPOCH_SCORE_STATS,fetch:()=>epochRunRows('Furniture Assembly')};
export default board;
