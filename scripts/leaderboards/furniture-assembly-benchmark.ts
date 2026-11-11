import type {Leaderboard} from './types.ts';
import {EPOCH_COV1_FEED,epochCov1Rows} from '../lib/boards/epoch-cov1.ts';
const board:Leaderboard={benchmark:'furniture-assembly-benchmark',url:'https://epoch.ai/benchmarks/furniture-assembly',feed:EPOCH_COV1_FEED,
terms:'Epoch AI publishes its benchmark data under CC BY 4.0. The almanac credits and links Epoch AI.',fetch:()=>epochCov1Rows('Furniture Assembly')};
export default board;
