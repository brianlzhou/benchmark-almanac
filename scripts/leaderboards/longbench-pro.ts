// LongBench Pro evaluates long-context understanding across 11 natural-language task types.
// The headline uses the first overall score published for each model row, with language and difficulty values in metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2601.02872';
const board:Leaderboard={benchmark:'longbench-pro',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[0]?.[0]==='Model'&&x[1]?.[2]==='Type');if(!t)throw new Error('LongBench Pro table missing');const rows:LeaderboardRow[]=[];for(const r of t.slice(2)){const model=r[1]||r[0];if(!model||model==='Model')continue;const vals=[r[5],r[7],r[9],r[11],r[13],r[15],r[17]].map(Number);if(!Number.isFinite(vals[0]))continue;rows.push({model,score:vals[0],metrics:{english:vals[1],chinese:vals[2],difficultyExtreme:vals[3],difficultyHard:vals[4],difficultyModerate:vals[5],difficultyEasy:vals[6]}});}return checked(rows,46);}};export default board;
