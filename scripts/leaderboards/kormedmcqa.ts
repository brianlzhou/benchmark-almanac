// Maker-published paper results. Keep diagnostic scores in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2403.01469';
export default {
 benchmark:'kormedmcqa', static: 'paper', parts: {
  doctor: { name: 'Doctor', group: 'Domain' },
  nurse: { name: 'Nurse', group: 'Domain' },
  pharmacist: { name: 'Pharmacist', group: 'Domain' },
  dentist: { name: 'Dentist', group: 'Domain' },
},url:'https://arxiv.org/abs/2403.01469',feed,terms:PAPER_TERMS,
 async fetch():Promise<LeaderboardRow[]> {
  const ts=flatPaperTables(await paperHtml(feed)).map(grid);
  const t=ts.find(t=>t[0]?.join('|')==='Model|Doctor|Nurse|Pharm|Dentist|Avg|MedQA');
  if(!t)throw new Error('KorMedMCQA full test results missing');
  const rows:LeaderboardRow[]=t.slice(1).filter(r=>num(r[5])!==undefined && r[0]!=='Examinees Average').map(r=>({model:r[0]==='claude-3-5-sonnet'?'Claude 3.5 Sonnet (snapshot unspecified)':r[0],score:num(r[5])!,setting:'5-shot; temperature 0',metrics:{doctor:num(r[1])!,nurse:num(r[2])!,pharmacist:num(r[3])!,dentist:num(r[4])!}}));
  const cot=ts.find(t=>t[0]?.join('|')==='Model|Doctor|Nurse|Pharmacist|Dentist|Average');
  if(!cot)throw new Error('KorMedMCQA CoT table missing');
  for(const r of cot.slice(1).filter(r=>r[0].includes('(CoT)'))){
   const model=r[0].replace(' (CoT)','').replace('Claude-3.5-sonnet','Claude 3.5 Sonnet (snapshot unspecified)');
   rows.push({model,score:num(r[5])!,setting:'5-shot; temperature 0; CoT',metrics:{doctor:num(r[1])!,nurse:num(r[2])!,pharmacist:num(r[3])!,dentist:num(r[4])!}});
  }
  return checked(rows,3);
 },
} satisfies Leaderboard;
