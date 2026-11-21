// XPU-A results, output tokens per operator, error counts and published operator roofline scores.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2607.14541";
const board:Leaderboard={benchmark:"atrex-bench", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,aliases:{},
 stats:{
  compile:{name:'Compile pass rate',unit:'%',better:'higher'}, correct:{name:'Correctness pass rate',unit:'%',better:'higher'}, flyDSL:{name:'FlyDSL adoption',unit:'%',better:'higher'},
  torchCompileSpeedup:{name:'Speedup versus torch.compile',unit:'speedup',better:'higher'}, productionSpeedup:{name:'Speedup versus production kernel',unit:'speedup',better:'higher'},
  correctOperators:{name:'Correct operators',unit:'count'}, tokensPerCorrectOperator:{name:'Tokens per correct operator',unit:'tokens'},
  compileExceptions:{name:'Compile exceptions',unit:'count'}, compileTimeouts:{name:'Compile timeouts',unit:'count'}, compileStructure:{name:'Compile structure failures',unit:'count'},
  runtimeNumeric:{name:'Runtime numeric mismatches',unit:'count'}, runtimeTimeouts:{name:'Runtime timeouts',unit:'count'}, runtimeExceptions:{name:'Runtime exceptions',unit:'count'}, slow:{name:'Correct but slow kernels',unit:'count'}, totalFailures:{name:'Total failures',unit:'count'},
 },
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"\",\"Pass rate (%)\",\"Pass rate (%)\",\"Pass rate (%)\",\"Roofline\",\"vs. baseline (\\\\times)\",\"vs. baseline (\\\\times)\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 const volume = ts.find(table => table[0]?.[0] === 'Cand.' && table[0][1] === 'Out (M)');
 const failures = ts.find(table => table[0]?.includes('Runtime') && table[1]?.at(-1) === 'Total');
 const operators = ts.find(table => table[0]?.includes('S_{Opus}') && table[0]?.includes('S_{GPT}'));
 const parts: NonNullable<Leaderboard['parts']> = {};
 for(const c of t.slice(2)) {
   const metrics: Record<string, number> = {compile:Number(c[1]),correct:Number(c[2]),flyDSL:Number(c[3]),
     torchCompileSpeedup:Number(c[5]),productionSpeedup:Number(c[6])};
   const v = volume?.find(r => r[0] === c[0]);
   let tokens: number | undefined;
   if (v) {
     tokens = Number(v[1]) * 1e6 / 30;
     metrics.correctOperators = Number(v[2]);
     metrics.tokensPerCorrectOperator = Number(v[3]) * 1000;
   }
   const errors = failures?.find(r => r[0] === c[0]);
   if (errors) {
     const keys = ['compileExceptions','compileTimeouts','compileStructure','runtimeNumeric','runtimeTimeouts','runtimeExceptions','slow','totalFailures'];
     keys.forEach((key,i) => { const n = Number(errors[i+1]); if (Number.isFinite(n)) metrics[key] = n; });
   }
   const opCol = c[0] === 'Claude Opus 4.7' ? 6 : c[0] === 'GPT-5.5' ? 7 : -1;
   for (const op of operators?.slice(1) ?? []) {
     const n = parseFloat(op[opCol]);
     if (!Number.isFinite(n)) continue;
     const key = op[0].replace(/_([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
     metrics[key] = n;
     parts[key] = {name: op[0], group: 'Operator'};
   }
   out.push({model:c[0],score:Number(c[4]),setting:'XPU-A; 30 operators',tokens,metrics});
 }
 board.parts = parts;
 return checked(out,3);
 }};export default board;
