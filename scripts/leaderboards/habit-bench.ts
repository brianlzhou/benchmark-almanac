// HABIT-Bench: the published Macro column is accuracy across four domains.
// Memory methods are harnesses. Exclude pooled method averages.
// The appendix adds smaller Qwen3 models under the earlier reader protocol.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';
const FEED = "https://arxiv.org/html/2610.24520";
const board: Leaderboard = {
 benchmark: "habit-bench", static: 'paper',
 parts: {
   food: { name: 'Food', group: 'Domain' },
   finance: { name: 'Finance', group: 'Domain' },
   software: { name: 'Software', group: 'Domain' },
   travel: { name: 'Travel', group: 'Domain' },
 },
 url: "https://arxiv.org/html/2610.24520",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=flatPaperTables(await fetchText(FEED)).map(grid);const main=ts.find(t=>t[0]?.[1]==='Qwen3-235B-A22B'&&t[1]?.[5]==='Macro');if(!main)throw new Error('HABIT main missing');const rows:LeaderboardRow[]=[];
 for(const r of main.slice(2)){if(num(r[5])===undefined||/avg\./.test(r[0]))continue;for(const c of [1,6])rows.push({model:main[0][c],harness:r[0],score:num(r[c+4])!,metrics:Object.fromEntries(['food','finance','software','travel'].map((k,i)=>[k,num(r[c+i])!]))});}
 const scale=ts.find(t=>t[0]?.join('|')==='Method|4B|8B|14B|32B|235B-A22B');if(!scale)throw new Error('HABIT scale table missing');
 for(const r of scale.slice(1))for(let c=1;c<=4;c++)rows.push({model:'Qwen3-'+scale[0][c],harness:r[0],setting:'earlier reader protocol',score:num(r[c])!});
 const domains = ['food', 'finance', 'software', 'travel'];
 const diagnostics = ts.find(t => t[0]?.[1] === 'Qwen3-8B' && t[1]?.[1] === 'Food');
 for (const r of diagnostics?.slice(2) ?? []) {
   for (const start of [1, 5]) {
     const model = diagnostics![0][start];
     const metrics = Object.fromEntries(domains.map((domain, i) => [domain, num(r[start + i])!]));
     if (!Object.values(metrics).every(Number.isFinite)) continue;
     if (!rows.some(row => row.model === model && row.harness === r[0])) {
       rows.push({ model, harness: r[0], setting: 'paper diagnostic', metrics,
         score: Object.values(metrics).reduce((a, b) => a + b, 0) / domains.length });
     }
   }
 }
 const slices = ts.find(t => t[0]?.[1] === 'F/S temporal');
 const evidence = ts.find(t => t[0]?.includes('Memory tokens'));
 for (const row of rows) {
   const size = row.model.match(/^Qwen3-(\d+)B/);
   if (size) row.params = Number(size[1]);
   const metrics = row.metrics ??= {};
   if (row.model === 'Qwen3-32B') {
     const r = evidence?.find(r => r[0] === row.harness && num(r[1]) === row.score);
     if (r) evidence![0].slice(2).forEach((key, i) => {
       const value = num(r[i + 2]);
       if (value !== undefined) metrics[key] = value;
     });
   }
   if (row.model !== 'Qwen3-8B') continue;
   const slice = slices?.find(r => r[0] === row.harness);
   if (slice) slices![0].slice(1).forEach((key, i) => {
     const value = num(slice[i + 1]);
     if (value !== undefined) {
       metrics[key] = value;
       board.parts![key] = { name: key, group: 'Capability slice' };
     }
   });
   for (const t of ts.filter(t => t[0]?.join('|') === 'Method|Food|Finance|Software|Travel')) {
     const r = t.find(r => r[0] === row.harness);
     if (r) domains.forEach((key, i) => {
       const values = r[i + 1]?.match(/[\d.]+/g)?.map(Number);
       if (values?.length === 3) {
         metrics['userMacro:' + key] = values[0];
         metrics['userMacro:' + key + ':low'] = values[1];
         metrics['userMacro:' + key + ':high'] = values[2];
       }
     });
   }
 }
 return checked(rows,60);
 },
};
export default board;
