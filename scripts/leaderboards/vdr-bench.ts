// Use VDR, not the average over six different benchmarks.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED="https://raw.githubusercontent.com/Osilly/Vision-DeepResearch/HEAD/README.md";
const board:Leaderboard={benchmark:"vdr-bench",url:FEED,feed:FEED,
 terms:'Public maker results. The source robots.txt permits this public path or is absent. No additional restriction on reading these results is stated.',
 async fetch(){const ts=markdownTables(await fetchText(FEED));const out:LeaderboardRow[]=[];
const t=ts.find(t=>t[0]?.[1]==='VDR');if(!t)throw new Error('VDR table missing');let group='';
 for(const c of t.slice(1)){if(!c[1]){group=c[0];continue;}const n=c[1].match(/^([\d.]+)/);if(!n)continue;
 out.push({model:c[0].replace(/ \(Ours\)| \(Agentic\)/g,''),score:Number(n[1]),harness:group==='Agent Workflow'||group==='Ours'?'Vision-DeepResearch':undefined,setting:group==='Direct Answer'?'direct answer':'agentic search'});}
 return checked(out,3);
 }};export default board;
