// QASPER Table 4: all-test answer F1 with oracle gold evidence, not end-to-end document retrieval.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2105.03011';
export default {
 benchmark:'qasper', parts: {
  spanF1: { name: 'Span', group: 'Task type' },
  abstractiveF1: { name: 'Abstractive', group: 'Task type' },
},url:'https://arxiv.org/abs/2105.03011',feed,terms:PAPER_TERMS,
 async fetch():Promise<LeaderboardRow[]> {
  const t=flatPaperTables(await paperHtml(feed)).map(grid).find(t=>t[1]?.join('|')==='Model|Span|Abstractive|Overall');
  if(!t)throw new Error('QASPER gold-evidence table missing');
  return checked(t.slice(2).map(r=>({model:r[0],score:num(r[3])!,setting:'oracle gold evidence supplied',metrics:{spanF1:num(r[1])!,abstractiveF1:num(r[2])!}})),3);
 },
} satisfies Leaderboard;
