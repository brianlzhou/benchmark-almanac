// Official MORSE-500 overall and category results. The date is the leaderboard's
// publication date, not evidence for an API snapshot. Quantized variants stay distinct.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = 'https://morse-500.github.io/';
const board: Leaderboard = {
 benchmark: 'morse-500', url: URL, feed: URL,
 terms: 'Public author leaderboard. The Almanac credits the authors and links the source.',
 async fetch() {
  const t = tables(await fetchText(URL)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('ALL'));
  if(!t) throw new Error('MORSE-500 results table missing');
  const rows: LeaderboardRow[]=[];
  for(const r of t.slice(1)) {
   const score=num(r[4]);if(score===undefined||r[1]==='Human')continue;
   let model=r[1].replace(/[🥇🥈🥉]/gu,'').trim();
   if(/^(?:Gemini |GPT )/.test(model))model+=' (snapshot unspecified)';
   rows.push({model,score,date:r[3],metrics:Object.fromEntries(t[0].slice(5).flatMap((h,j)=>{const n=num(r[j+5]);return n===undefined?[]:[[h,n]];}))});
  }
  if(!rows.length)throw new Error('MORSE-500 empty');return rows;
 }
};
export default board;
