// ProcessBench tests whether a model can identify erroneous steps in mathematical reasoning.
// The score is the paper's Average F1 across GSM8K, MATH, OlympiadBench and Omni-MATH.
// This importer reads the main evaluation table from the paper HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2412.06559';
const board:Leaderboard={benchmark:'processbench',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,async fetch(){const t=grid(flatPaperTables(await paperHtml(FEED))[3]);if(t[0]?.at(-1)!=='Average')throw new Error('ProcessBench table changed');const rows=t.slice(2).filter(r=>r[0]&&!/^(Open-source|Proprietary|\\bigstar)/.test(r[0])&&Number.isFinite(Number(r.at(-1)))).map(r=>({model:r[0].replace(/^\\bigstar\s*/,''),score:Number(r.at(-1)),metrics:{gsm8k:Number(r[1]),math:Number(r[2]),olympiadBench:Number(r[3]),omniMath:Number(r[4])}}));return checked(rows,20);}};export default board;
