// RivaBench tests audio-visual video understanding on academic talks, stand-up comedy and synthetic decisions.
// The paper has no aggregate column, so the headline uses its first RivaBench part, StandUp.
// This importer reads the main comparison table from the paper HTML.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2502.11775';
const n=(s:string)=>Number(s.replace(/[^0-9.\-]/g,''));
const board:Leaderboard={benchmark:'rivabench',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,headline:'The paper reports no overall score, so this is the StandUp accuracy column, the first RivaBench part.',async fetch(){const t=grid(paperTables(await paperHtml(FEED))[8]);if(t[0]?.[4]!=='RivaBench')throw new Error('RivaBench table changed');const rows=t.slice(3).filter(r=>r[0]&&r[1]).map(r=>({model:r[0].includes('(ours')?r[0]:r[0].replace(/\s*\([^)]*\)/g,''),setting:r[1],score:n(r[4]),metrics:{academic:n(r[5]),synthDec:n(r[6])}}));return checked(rows,8);}};export default board;
