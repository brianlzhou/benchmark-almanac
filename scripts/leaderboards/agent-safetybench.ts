// Agent-SafetyBench measures the percentage of interactions a safety judge rates safe.
// Table 5 supplies the total and risk categories, Table 6 scores failure modes and Table 8 identifies versions.
import type { Leaderboard } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { grid,paperTables,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2412.14470';
const risks = ['Behavior','Content','Leak','Property','Spread','Physical','Law','Availability','Code','Produce'];
const modes = Array.from({length:10},(_,i)=>'M'+(i+1));
const board: Leaderboard = {
  benchmark:'agent-safetybench',url:feed,feed,static:'paper',terms:PAPER_TERMS,
  parts:Object.fromEntries([...risks.map(k=>[k,k]),...modes.map((k,i)=>[k,'Failure mode '+(i+1)])]),
  aliases:{'GPT-4o-2024-08-06':'gpt-4o-aug-2024','GPT-4o-mini-2024-07-18':'gpt-4o-mini','GPT-4-Turbo-2024-04-09':'gpt-4-turbo-apr-2024'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t=>t[0].join('|')===['Model','Total',...risks].join('|'));
    const failures = tables.find(t=>t[0].join('|')===['Model','Total',...modes].join('|'));
    const versions = tables.find(t=>t[0].join('|')==='Model|Model Size|Access|Version|Creator');
    if (!main || !failures || !versions) throw new Error('Missing Agent-SafetyBench results columns');
    return checked(main.slice(1).filter(r=>r[0]!=='Average').map(([label,total,...scores])=>{
      const failure = failures.find(r=>r[0]===label);
      const version = versions.find(r=>r[0]===label);
      if (!failure || !version || failure[1]!==total) throw new Error('Missing or inconsistent results for '+label);
      const values = [...scores,...failure.slice(2)];
      if (values.length!==20 || ![total,...values].every(v=>/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid safety score');
      const model = /^\d{4}-\d{2}-\d{2}$/.test(version[3]) ? label+'-'+version[3] : label;
      const size = version[1].match(/^([\d.]+)B$/);
      return {model,score:Number(total),params:size ? Number(size[1]) : undefined,
        metrics:Object.fromEntries([...risks,...modes].map((key,i)=>[key,Number(values[i])]))};
    }),16);
  },
};
export default board;
