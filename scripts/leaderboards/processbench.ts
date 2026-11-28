// ProcessBench tests whether a model can identify erroneous steps in mathematical reasoning.
// The score is the paper's Average F1 across GSM8K, MATH, OlympiadBench and Omni-MATH.
// This importer reads the main evaluation table from the paper HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2412.06559';
const board:Leaderboard={benchmark:'processbench',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,parts:{gsm8k:'GSM8K',math:'MATH',olympiadBench:'OlympiadBench',omniMath:'Omni-MATH'},async fetch(){const t=grid(flatPaperTables(await paperHtml(FEED))[3]);if(t[0]?.at(-1)!=='Average')throw new Error('ProcessBench table changed');const rows:LeaderboardRow[]=[];let open:boolean|undefined;for(const r of t.slice(1)){if(!r[0])continue;if(/^Open-source/i.test(r[0])){open=true;continue;}if(/^Proprietary/i.test(r[0])){open=false;continue;}if(/^\\bigstar/.test(r[0])||!Number.isFinite(Number(r.at(-1))))continue;rows.push({model:r[0].replace(/^\\bigstar\s*/,''),score:Number(r.at(-1)),...(open===undefined?{}:{open}),metrics:{gsm8k:Number(r[1]),math:Number(r[2]),olympiadBench:Number(r[3]),omniMath:Number(r[4])}});}return checked(rows,20);}};export default board;
