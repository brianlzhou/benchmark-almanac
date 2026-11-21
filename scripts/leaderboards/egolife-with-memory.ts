// EgoLifeQA: Table 5 Average covers all five question families with EgoButler memory.
// Caption input, audio and identity options are whole-benchmark configurations.
// Match the paper’s parameter counts to the same captioning checkpoints.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2503.03803";
const board: Leaderboard = {
 benchmark: "egolife-with-memory", static: 'paper',
 parts: {
   entityLog: { name: 'Entity log', group: 'Task type' },
   eventRecall: { name: 'Event recall', group: 'Task type' },
   habitInsight: { name: 'Habit insight', group: 'Task type' },
   relationMap: { name: 'Relation map', group: 'Task type' },
   taskMaster: { name: 'Task master', group: 'Task type' },
 },
 url: "https://arxiv.org/html/2503.03803",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const all=tables(await fetchText(FEED)).map(grid);
 const sizes=new Map<string,number>();
 for (const [model,size] of all.find(t=>t[0]?.[1]==='#Param')?.slice(1) ?? []) {
   if (/^[\d.]+B$/.test(size)) sizes.set(model,parseFloat(size));
 }
 const checkpoints:Record<string,string>={'EgoGPT (EgoIT-99K)':'EgoGPT (EgoIT)','EgoGPT (EgoIT-99K+D1)':'EgoGPT (EgoIT+EgoLifeD1)'};
 const t=all.find(t=>t[1]?.[4]==='EntityLog'&&t[1]?.[9]==='Average');if(!t)throw new Error('EgoLifeQA table missing');
 return checked(t.slice(2).map(r=>({model:r[0],params:sizes.get(checkpoints[r[0]] ?? r[0]),score:num(r[9])!,harness:'EgoButler',setting:`frames ${r[1]}, audio ${r[2]}, identity ${r[3]}`,metrics:Object.fromEntries(['entityLog','eventRecall','habitInsight','relationMap','taskMaster'].map((k,i)=>[k,num(r[i+4])!]))})),5);
 },
};
export default board;
