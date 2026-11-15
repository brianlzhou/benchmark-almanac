// Test set: 80 held-out tasks, Pass@1 F1. Dev results never become headline rows.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {markdownTables} from '../lib/boards/github-markdown.ts';
import {num} from '../lib/html.ts';
const FEED='https://raw.githubusercontent.com/agentdeepsynthesis/deepsynth-bench/HEAD/README.md';
const board:Leaderboard={benchmark:'deepsynth',url:'https://huggingface.co/spaces/DeepSynthesisTeam/deepsynth-leaderboard',feed:FEED,
 terms:'Apache-2.0 repository; raw.githubusercontent.com has no robots.txt.',
 async fetch(){
  const table=markdownTables(await fetchText(FEED)).find(t=>t[0]?.includes('Base model') && t[0]?.includes('Precision'));
  if(!table)throw new Error('Test table missing');
  const rows=table.slice(1).map(c=>({model:c[2],harness:c[1],setting:'test, Pass@1',score:num(c[4])!,metrics:{precision:num(c[5])!,recall:num(c[6])!,exactMatch:num(c[7])!,judge:num(c[8])!}}));
  if(rows.length<3 || rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid test rows');return rows;
 }};export default board;
