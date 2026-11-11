// Agent Startup Bench: ByteDance's Seed2.1 page reports five model success percentages in a CSS grid.
// Read the grid's live column headers and the benchmark row, preserving the model configuration names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, num } from '../lib/html.ts';
const FEED='https://seed.bytedance.com/en/seed2_1';
const board:Leaderboard={benchmark:'agent-startup-bench-bytedance',url:FEED,feed:FEED,terms:'Public ByteDance Seed evaluation table, subject to the site disclaimer and terms; the Almanac credits and links the source.',aliases:{'Seed2.1 Turbo':'doubao-seed-2-1-turbo'},async fetch(){
const html=await fetchText(FEED);const headers=new Map<number,string>();let target=-1;const rows:LeaderboardRow[]=[];
for(const m of html.matchAll(/<div\b[^>]*class="doubao-blogs-table__cell\b[^\"]*"[^>]*style="grid-row:(\d+)[^\"]*?grid-column:(\d+)[^\"]*"[^>]*>([\s\S]*?)<\/div>/g)){
const row=Number(m[1]),col=Number(m[2]),value=text(m[3]);if(row===1){if(col===1)target=-1;headers.set(col,value);continue;}
if(col===1&&value.startsWith('Agent Startup Bench'))target=row;
if(row===target&&col>1){const score=num(value),model=headers.get(col);if(model&&score!==undefined&&!rows.some(r=>r.model===model&&r.score===score))rows.push({model,score});}
}if(!rows.length)throw new Error('Missing Agent Startup Bench grid');return rows;}};
export default board;
