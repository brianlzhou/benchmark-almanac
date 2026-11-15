// Use only the full 100-paper main track, not the 10-paper controlled subset.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED="https://raw.githubusercontent.com/Yaxin9Luo/AutoDesign/HEAD/README.md";
const board:Leaderboard={benchmark:"posterbench",url:FEED,feed:FEED,
 terms:'Public maker results. The source robots.txt permits this public path or is absent. No additional restriction on reading these results is stated.',
 async fetch(){const ts=markdownTables(await fetchText(FEED));const out:LeaderboardRow[]=[];
const t=ts.find(t=>t[0]?.includes('Design harness'));if(!t)throw new Error('Main track missing');
 for(const c of t.slice(1))out.push({model:c[5],score:Number(c[1]),harness:[c[2],c[3],c[4]].filter(x=>x!=='—').join(' / '),setting:'100-paper main track'});
 return checked(out,3);
 }};export default board;
