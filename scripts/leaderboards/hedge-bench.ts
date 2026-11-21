// Hedge-Bench-Public joint success with trial counts, token use, turns and citation measures.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2606.03918";
const board:Leaderboard={benchmark:"hedge-bench", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 stats:{coverage:{name:'Coverage',unit:'%',better:'higher'},accuracy:{name:'Accuracy',unit:'%',better:'higher'},trial1Passes:{name:'Trial 1 passes',unit:'count'},trial2Passes:{name:'Trial 2 passes',unit:'count'},trial3Passes:{name:'Trial 3 passes',unit:'count'},turns:{name:'Turns',unit:'count',better:'lower'},penalty:{name:'Penalty',unit:'score',better:'lower'},reportTokens:{name:'Report tokens',unit:'tokens'},cites:{name:'Citations',unit:'count'},files:{name:'Files',unit:'count'},density:{name:'Evidence density',unit:'score',better:'higher'},objections:{name:'Objections',unit:'count'}},
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Model\",\"Effort\",\"T1\",\"T2\",\"T3\",\"Joint (%)\",\"Coverage (%)\",\"Accuracy (%)\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 const resource = ts.find(t => t[0][1] === 'Output tokens');
 const reports = ts.find(t => t[0][1] === 'Mean report tokens');
 const citations = ts.find(t => t[0][2] === 'Cites');
 const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
 const lookup = (table: string[][] | undefined, model: string) =>
   table?.slice(1).find(r => normalize(r[0]) === normalize(model));
 for (const c of t.slice(1)) {
   const usage = lookup(resource, c[0]);
   const report = lookup(reports, c[0]);
   const cite = lookup(citations, c[0]);
   const number = (cell?: string) => cell?.trim() ? Number(cell.replaceAll(',', '')) : NaN;
   const metrics = Object.fromEntries(Object.entries({
     coverage: number(c[6]), accuracy: number(c[7]), trial1Passes: number(c[2]),
     trial2Passes: number(c[3]), trial3Passes: number(c[4]), turns: number(usage?.[2]),
     penalty: number(usage?.[5]), reportTokens: number(report?.[1]), cites: number(cite?.[2]),
     files: number(cite?.[3]), density: number(cite?.[4]), objections: number(cite?.[5]),
   }).filter(([, value]) => Number.isFinite(value)));
   const tokens = number(usage?.[1]);
   out.push({ model: c[0], score: Number(c[5]), trials: 3, setting: 'Hedge-Bench-Public; effort ' + c[1],
     tokens: Number.isFinite(tokens) ? tokens : undefined, metrics });
 }
 return checked(out,3);
 }};export default board;
