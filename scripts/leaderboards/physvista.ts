// PhysVista evaluates physical state perception, plausibility assessment and dynamics reasoning.
// The headline uses the paper's Avg. Acc. column for Physical Dynamics Reasoning.
// This importer reads Table 3 from the paper HTML and keeps each reasoning task as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2610.00559';
const board:Leaderboard={benchmark:'physvista',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,headline:'The headline is the Physical Dynamics Reasoning Avg. Acc. column.',async fetch(){const t=grid(paperTables(await paperHtml(FEED))[2]);if(t[0]?.at(-1)!=='Avg. Acc.')throw new Error('PhysVista table changed');const rows=t.slice(1).filter(r=>r[0]).map(r=>({model:r[0].replace(/\s+\((?:OpenAI|Anthropic|Google|ByteDance|xAI|Alibaba|Team et al\.|Bai et al\.)[^)]*\)$/,''),score:Number(r.at(-1)?.replace('%','')),metrics:{order:Number(r[1].replace('%','')),mechanism:Number(r[2].replace('%','')),violation:Number(r[3].replace('%','')),prediction:Number(r[4].replace('%','')),counterfactual:Number(r[5].replace('%','')),critique:Number(r[6].replace('%',''))}}));return checked(rows,10);}};export default board;
