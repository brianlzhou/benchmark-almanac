// GEN-Bench evaluates dynamic job-shop scheduling with average relative percentage deviation.
// Table 3 reports average RPD for seven language-model ReflecSched variants.
import type {Leaderboard,LeaderboardRow} from './types.ts'; import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts'; import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2508.01724';
const parts = {
  ...Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`small${i + 1}`, { name: `Small instance ${i + 1}`, group: 'Small instances' }])),
  ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`normal${i + 1}`, { name: `Normal instance ${i + 1}`, group: 'Normal instances' }])),
};
const board:Leaderboard={
  benchmark:'gen-bench-dynamic-scheduling',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,parts,
  stats:{
    avgRank:{name:'Average rank',unit:'score',better:'lower'},
    smallTokens:{name:'Small-instance tokens',unit:'tokens',better:'lower'},
    normalTokens:{name:'Normal-instance tokens',unit:'tokens',better:'lower'},
  },
  async fetch():Promise<LeaderboardRow[]>{const t=paperTables(await paperHtml(FEED)).map(grid)[20];if(!t||t[2]?.[0]!=='Avg. RPD (%)')throw new Error('GEN-Bench table missing');const names=t[1].slice(6);const vals=t[2].slice(6).map(Number);return checked(names.map((model,i)=>({model,score:vals[i],harness:'ReflecSched'})),7)}
};
export default board;
