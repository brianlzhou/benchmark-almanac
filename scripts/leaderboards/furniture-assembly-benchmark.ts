import type {Leaderboard} from './types.ts';
import {EPOCH_RUNS_FEED,EPOCH_SCORE_STATS,epochRunRows} from '../lib/boards/epoch-runs.ts';
const board:Leaderboard={benchmark:'furniture-assembly-benchmark',url:'https://epoch.ai/benchmarks/furniture-assembly',feed:EPOCH_RUNS_FEED,
terms:'Epoch AI publishes its benchmark data under CC BY 4.0. The almanac credits and links Epoch AI.',stats:{meanScore:EPOCH_SCORE_STATS.meanScore,'scorer:furniture_score/accuracy':EPOCH_SCORE_STATS['scorer:furniture_score/accuracy'],'scorerSpread:furniture_score/accuracy':EPOCH_SCORE_STATS['scorerSpread:furniture_score/accuracy'],'Training compute (FLOP)':EPOCH_SCORE_STATS['Training compute (FLOP)'],activeParams:EPOCH_SCORE_STATS.activeParams,'Hardware quantity':{ ...EPOCH_SCORE_STATS['Hardware quantity'], name:'Hardware count' }},fetch:()=>epochRunRows('Furniture Assembly')};
export default board;
