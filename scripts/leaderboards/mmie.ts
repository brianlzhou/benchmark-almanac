// Maker's whole-benchmark aggregate. Auxiliary metrics are not separate rows.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2410.10139";
const board:Leaderboard={benchmark:'mmie',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"Model\",\"Situational analysis\",\"Project-based learning\",\"Multi-step reasoning\",\"AVG\"]");if(!t)throw new Error('Reviewed table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1))out.push({model:c[0].replace(/ \(.*\)/,''),score:Number(c[4]),setting:'native interleaved input and output',metrics:{situationalAnalysis:Number(c[1]),projectLearning:Number(c[2]),multiStepReasoning:Number(c[3])}});return checked(out,3);
 }};export default board;
