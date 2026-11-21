// Whole benchmark exact match; exclude random guessing.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED="https://raw.githubusercontent.com/haolpku/K12-Dataset/HEAD/README.md";
const board:Leaderboard={benchmark:"k12-bench",url:FEED,feed:FEED,stats:{f1:{name:'F1',unit:'%',better:'higher'}},
 terms:'Public maker results. The source robots.txt permits this public path or is absent. No additional restriction on reading these results is stated.',
 async fetch(){const ts=markdownTables(await fetchText(FEED));const out:LeaderboardRow[]=[];
const t=ts.find(t=>t[0]?.includes('Overall EM'));if(!t)throw new Error('Overall table missing');
 for(const c of t.slice(1)){if(c[0].includes('Random'))continue;out.push({model:c[0],score:Number(c[1]),metrics:{f1:Number(c[2])}});}
 return checked(out,3);
 }};export default board;
