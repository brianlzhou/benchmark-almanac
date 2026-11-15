// Average survival length in turns, not percent. The catalog unit needs correction.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {markdownTables} from '../lib/boards/github-markdown.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://raw.githubusercontent.com/yingpengma/NCP-Bench/HEAD/README.md';
const board:Leaderboard={benchmark:'ncp-bench',url:'https://github.com/yingpengma/NCP-Bench',feed:FEED,
 terms:'MIT repository; public README results. raw.githubusercontent.com has no robots.txt restriction.',
 async fetch(){const t=markdownTables(await fetchText(FEED)).find(t=>t[0]?.[0]==='Model'&&t[0]?.[1]==='Avg. turns');if(!t)throw new Error('Main comparison missing');
 return checked(t.slice(1).map(c=>({model:c[0],score:Number(c[1]),setting:'Gemini-2.5-Flash auditor',metrics:{trajectory:Number(c[2]),commitments:Number(c[3]),factConflicts:Number(c[4]),commitmentConflicts:Number(c[5]),playerConflicts:Number(c[6])}})),3);
 }};export default board;
