// SimpleVQA: Table 3 reports overall Correct (CO), the answer accuracy in percent.
// The other overall metrics, including F-score, are secondary metrics. Table 6 adds text-only runs.
// Rows are the static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2502.13059";
const board: Leaderboard = {
 benchmark: "simplevqa", static: 'paper',
 parts: { chinese: { name: 'Chinese', group: 'Language' }, english: { name: 'English', group: 'Language' } },
 url: "https://arxiv.org/html/2502.13059",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));
 const t=ts.find(t=>t[0]?.includes('Overall results'));
 const blind=ts.find(t=>t[0]?.join('|')==='Models|CO|IN|NA|CGA');
 if(!t || !blind) throw new Error('SimpleVQA result tables missing');
 const rows:LeaderboardRow[]=t.filter(r=>r.length===15 && num(r[1])!==undefined).map(r=>({model:r[0],score:num(r[1])!,setting:'image and text',metrics:Object.fromEntries(['notAttempted','incorrect','correctGivenAttempted','fScore','LS','OIR','TE','PE','LB','TP','QPR','AC','OAR'].map((k,i)=>[k,num(r[i+2])!]))}));
 for(const r of blind.slice(1)) rows.push({model:r[0],score:num(r[1])!,setting:'text only',metrics:{incorrect:num(r[2])!,notAttempted:num(r[3])!,correctGivenAttempted:num(r[4])!}});
 const languages = ts.find(t => t[0]?.includes('Chinese partial results'));
 const atomic = ts.find(t => t[0]?.includes('Atomic-Given'));
 const normalize = (s: string) => s.toLowerCase().replace(/^openai\s+/, '').replace(/[^a-z0-9]/g, '');
 const models = new Map<string, { open: boolean }>();
 for (const table of ts.filter(t => /^(Open|Close)-Sourced Model$/.test(t[0]?.[0]))) {
   for (const [model, link] of table.slice(1)) if (/^https?:/.test(link)) models.set(normalize(model), { open: table[0][0].startsWith('Open') });
 }
 let open: boolean | undefined;
 for (const cells of t) {
   if (cells.length === 1 && /source/i.test(cells[0])) open = /^Open-source/i.test(cells[0]);
   const row = rows.find(r => r.model === cells[0] && r.setting === 'image and text');
   if (row) row.open = open;
 }
 for (const row of rows) {
   Object.assign(row, models.get(normalize(row.model)));
   const breakdown = row.setting === 'image and text' && languages?.find(cells => cells[0] === row.model);
   if (breakdown) {
     const keys = ['chinese', 'chineseCGA', 'chineseFScore', 'english', 'englishCGA', 'englishFScore',
       ...languages![1].slice(6).map(key => 'fScore:' + key)];
     keys.forEach((key, i) => { const v = num(breakdown[i + 1]); if (v != null) row.metrics![key] = v; });
   }
   const cfq = atomic?.find(cells => cells[0] === row.model);
   if (cfq) for (const [i, key] of ['origin','atomic','atomicGiven'].entries()) {
     const value = num(cfq[i + 1]);
     if (value != null) row.metrics!['cfq:' + key] = value;
   }
 }
 return checked(rows,26);
 },
};
export default board;
