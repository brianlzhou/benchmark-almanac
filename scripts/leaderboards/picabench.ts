// Overall physical correctness; consistency is a separate metric.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED="https://picabench.github.io";
const board:Leaderboard={benchmark:"picabench",url:FEED,feed:FEED,
 terms:'Public maker results. The source robots.txt permits this public path or is absent. No additional restriction on reading these results is stated.',
 async fetch(){const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));const out:LeaderboardRow[]=[];
const t=ts.find(t=>t[0]?.includes('Overall'));if(!t)throw new Error('Overall table missing');
 for(const c of t.slice(2)){if(c.length!==19||c[0].includes('Improvement'))continue;out.push({model:c[0]==='Gemini'?'Gemini (image model unspecified)':c[0],score:Number(c[17]),metrics:{consistency:Number(c[18])}});}
 return checked(out,3);
 }};export default board;
