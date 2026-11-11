import type {Leaderboard} from './types.ts';
import {EPOCH_RUNS_FEED,epochRunRows} from '../lib/boards/epoch-runs.ts';
const board:Leaderboard={benchmark:'furniture-assembly-benchmark',url:'https://epoch.ai/benchmarks/furniture-assembly',feed:EPOCH_RUNS_FEED,
terms:'Epoch AI publishes its benchmark data under CC BY 4.0. The almanac credits and links Epoch AI.',fetch:()=>epochRunRows('Furniture Assembly')};
export default board;
