// DynaMath: the paper's Table 2 ALL column is average-case accuracy over 5,010 generated questions.
// Worst-case accuracy, robustness ratios, decoding limits and topic scores are metrics. Shot count changes the whole-benchmark prompt.
// Table 6 identifies GPT-4o as 2024-08-06 and Claude 3.5 as 2024-06-20.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2411.00836";
const board: Leaderboard = {
 benchmark: "dynamath", static: 'paper',
 parts: {
   PG: { name: 'Plane geometry', group: 'Domain' },
   SG: { name: 'Solid geometry', group: 'Domain' },
   AG: { name: 'Analytic geometry', group: 'Domain' },
   AL: { name: 'Algebra', group: 'Domain' },
   PT: { name: 'Puzzle test', group: 'Domain' },
   GT: { name: 'Graph theory', group: 'Domain' },
   ST: { name: 'Statistics', group: 'Domain' },
   SF: { name: 'Scientific figure', group: 'Domain' },
   AR: { name: 'Arithmetic', group: 'Domain' },
   EL: { name: 'Elementary school', group: 'Difficulty' },
   HI: { name: 'High school', group: 'Difficulty' },
   UN: { name: 'Undergraduate', group: 'Difficulty' },
 },
 url: "https://arxiv.org/html/2411.00836",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));
 const candidates=ts.filter(t=>t[0]?.join('|').startsWith('Model|ALL|PG|SG'));
 if(candidates.length<2) throw new Error('DynaMath tables missing');
 const [avg,worst,ratio]=candidates;
 const openStart = avg.findIndex(r => r[0].startsWith('Open-source'));
 const hyper = ts.find(t => t[0]?.includes('Hyperparameters'));
 return checked(avg.filter(r=>r.length===14 && num(r[1])!==undefined && !/^Human/.test(r[0])).map(r=>{

 let model=r[0].replace(/^(?:Zero-shot|3-shot CoT) /,'').replace(/ \(3-shot CoT\)$/,'');
 const config = hyper?.find(v => v[0].toLowerCase() === model.toLowerCase())?.[1];
 if(model==='GPT-4o')model='gpt-4o-2024-08-06';
 if(model==='Claude-3.5')model='claude-3-5-sonnet-20240620';
 const metrics=Object.fromEntries(avg[0].slice(2).map((k,i)=>[k,num(r[i+2])!]));
 for (const [name, table] of [['worstCase', worst], ['robustnessRatio', ratio]] as const) {
   const row = table?.find(v => v[0].toLowerCase() === r[0].toLowerCase());
   if (!row) continue;
   for (let j = 1; j < row.length; j++) {
     const value = num(row[j]);
     if (value !== undefined) metrics[j === 1 ? name : name + '_' + table[0][j]] = value;
   }
 }
 for (const [key, label] of [['temperature', 'temperature'], ['maxOutputTokens', 'max_tokens']]) {
   const value = config?.match(new RegExp(label + '\\s*=\\s*([\\d.]+)'))?.[1];
   if (value) metrics[key] = Number(value);
 }
 return {model,open: openStart < 0 ? undefined : avg.indexOf(r) > openStart,score:num(r[1])!,setting:r[0].includes('3-shot CoT')?'3-shot CoT':'zero-shot',metrics};
 }),18);
 },
};
export default board;
