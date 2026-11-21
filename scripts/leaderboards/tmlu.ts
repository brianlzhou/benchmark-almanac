// TMLU tests Taiwanese Mandarin language understanding across 37 subjects.
// The headline score is five-shot direct-answer average accuracy, expressed as a percentage.
// Table 3 in the authors' paper reports overall and five subject-group accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2403.20180';
const board:Leaderboard={benchmark:'tmlu',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,parts:{humanities:'Humanities',other:'Other',socialScience:'Social science',stem:'STEM',taiwanSpecific:'Taiwan-specific'},async fetch(){
 const ts=paperTables(await paperHtml(URL)).map(grid); const t=ts.find(x=>x[0]?.[0]==='Model'&&x[0]?.includes('Average')); if(!t) throw new Error('TMLU direct table missing');
 const rows:LeaderboardRow[]=[]; for(const r of t.slice(1)){const model=r[0];const score=Number(r[6]); if(!model||!Number.isFinite(score)||model==='Model') continue; rows.push({model,score,metrics:{socialScience:Number(r[1]),stem:Number(r[2]),humanities:Number(r[3]),taiwanSpecific:Number(r[4]),other:Number(r[5])}});} return checked(rows,10);
}}; export default board;
