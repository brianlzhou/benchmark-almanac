// Mean score over all 70 tasks. Agent clients have different budgets; preserve their harness names.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {markdownTables} from '../lib/boards/github-markdown.ts';
import {num} from '../lib/html.ts';
const FEED='https://raw.githubusercontent.com/yeyuxin777/baoyan-agent-benchmark/HEAD/README.md';
const board:Leaderboard={benchmark:'graduate-admissions-agent-benchmark',harnesses:'system',url:'https://github.com/yeyuxin777/baoyan-agent-benchmark',feed:FEED,
 terms:'MIT software documentation and CC BY 4.0 original tasks; raw.githubusercontent.com has no robots.txt.',
 aliases:{'GPT Sol 6.1':'gpt-6-1-sol','GPT Astra 6':'gpt-6-astra'},
 async fetch(){
  const table=markdownTables(await fetchText(FEED)).find(t=>t[0]?.includes('Mean score / 100'));
  if(!table)throw new Error('Overall table missing');
  const rows=table.slice(1).map(c=>{const [harness,...parts]=c[1].split(' + ');return {model:parts.join(' + '),harness,score:num(c[4])!}});
  if(rows.length<3 || rows.some(r=>!r.model||!Number.isFinite(r.score)))throw new Error('Invalid overall rows');return rows;
 }};export default board;
