// Average survival length in turns, with a separate setting for each auditor.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {markdownTables} from '../lib/boards/github-markdown.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://raw.githubusercontent.com/yingpengma/NCP-Bench/HEAD/README.md';
const board:Leaderboard={benchmark:'ncp-bench',url:'https://github.com/yingpengma/NCP-Bench',feed:FEED,stats:{turns:{name:'Average turns',unit:'count',better:'higher'},trajectory:{name:'Trajectory score',unit:'%',better:'higher'},commitments:{name:'Satisfied commitments',unit:'%',better:'higher'},factConflicts:{name:'Fact conflicts',unit:'%',better:'lower'},commitmentConflicts:{name:'Commitment conflicts',unit:'%',better:'lower'},playerConflicts:{name:'Player-input conflicts',unit:'%',better:'lower'},conflictFreeRuns:{name:'Conflict-free runs',unit:'count',better:'higher'}},
 terms:'MIT repository; public README results. raw.githubusercontent.com has no robots.txt restriction.',
 async fetch() {
   const tables = markdownTables(await fetchText(FEED));
   const primary = tables.find(t => t[0]?.[0] === 'Model' && t[0]?.[1] === 'Avg. turns');
   if (!primary) throw new Error('Main comparison missing');
   const baseline = tables.find(t => t[0]?.includes('Conflict-free runs'));
   const rows = [];
   for (const table of [primary, baseline]) {
     if (!table) continue;
     for (const c of table.slice(1)) {
       const hiAgent = table === baseline && c[0] === 'HiAgent';
       const metrics = {turns: Number(c[1]), trajectory: Number(c[2]), commitments: Number(c[3]),
         factConflicts: Number(c[4]), commitmentConflicts: Number(c[5]), playerConflicts: Number(c[6]),
         ...(table === baseline && c[7] ? {conflictFreeRuns: Number(c[7])} : {})};
       rows.push({model: hiAgent ? 'GPT-4o-mini' : c[0], harness: hiAgent ? 'HiAgent' : undefined,
         score: Number(c[1]), setting: table === primary ? 'Gemini-2.5-Flash auditor' : 'GPT-5.4-mini auditor', metrics});
     }
   }
   return checked(rows, 3);
 }};export default board;
