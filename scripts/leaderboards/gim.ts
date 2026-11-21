// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2605.18663";
const board:Leaderboard={benchmark:"gim", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,aliases:{'Claude 4.7 Opus':'claude-opus-4-7','Claude 4.6 Opus':'claude-opus-4-6','Claude 4.6 Sonnet':'claude-sonnet-4-6','Claude 4 Opus':'claude-opus-4','Claude 4.5 Haiku':'claude-haiku-4-5'},
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Rank\",\"Configuration\",\"\\\\theta\",\"G3F\",\"G3.5F\",\"GPTm\",\"C4.5H\",\"Gma\",\"\\\\Delta\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1)){if(/human/i.test(c[1]))continue;const [model,setting]=c[1].split(' / ');out.push({model,setting,score:Number(c[2])});}
 return checked(out,3);
 }};export default board;
