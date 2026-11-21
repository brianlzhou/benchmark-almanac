// TaxaBench-8k tests cross-modal ecological retrieval and fine-grained species understanding.
// The headline is the TaxaBench-8k retrieval score reported in Table 3, in percent.
// The importer reads the named model rows in the paper's emergent-capabilities table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2411.00683';
const board:Leaderboard={benchmark:'taxabench-8k',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,stats:{iNat2021:{name:'iNaturalist 2021 score',unit:'%',better:'higher'}},async fetch(){
 const ts=paperTables(await paperHtml(URL)).map(grid); const t=ts.find(x=>x[0]?.includes('TaxaBench-8k')&&x[0]?.[0]==='Model'); if(!t) throw new Error('TaxaBench table missing');
 const rows:LeaderboardRow[]=[]; for(const r of t.slice(1)){const model=r[0]; const score=Number(r.at(-1)); if(!model||model==='-'||!Number.isFinite(score)) continue; const clean=model.replace(/\s*\[.*$/, '').trim(); const prior=rows.filter(x=>x.model===clean).length; rows.push({model:clean,setting:prior?`configuration ${prior+1}`:undefined,score,metrics:{iNat2021:Number(r.at(-2))}});} return checked(rows,2);
}}; export default board;
