// Published whole-benchmark headline, with settings kept separate.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2606.05806';
const board:Leaderboard={benchmark:'toolmaze', static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.length===18 && t[1]?.[1]==='NP');if(!t)throw new Error('Reviewed results missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){const m=c[0].match(/^(.+) \((w\/o hint|w\/ hint)\)$/);if(!m)throw new Error('Hint setting missing');out.push({model:m[1],setting:m[2],score:parseFloat(c[17]),metrics:{nonPerturbedSuccess:Number(c[1]),perturbedSuccess:Number(c[6]),recovery:Number(c[11]),recoveryCost:Number(c[16])}});}return checked(out,3);
 }};export default board;
