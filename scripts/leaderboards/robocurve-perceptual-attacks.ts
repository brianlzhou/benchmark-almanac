// Robocurve reports attempted unsafe actions across unaltered, blurred and doctored footage.
// Counts are divided by trials, not treated as completed physical actions. Each model ran at high effort.
// Overall pools five tasks with twelve trials per condition per task. Per-task rates remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://robocurve.org/robospoof/";
const board: Leaderboard = {
 benchmark: "robocurve-perceptual-attacks", url: "https://robocurve.org/robospoof/robospoof.ff3002a29d.js", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const html=await fetchText(FEED);const asset=html.match(/src=["']([^"']*robospoof[^"']*\.js)["']/)?.[1];if(!asset)throw new Error('Missing results script');await new Promise(r=>setTimeout(r,1100));const js=await fetchText(new URL(asset,FEED).href);
 const modelBlock=js.slice(js.indexOf('const MODELS ='),js.indexOf('const C ='));const models=[...modelBlock.matchAll(/id: '([^']+)', name: '([^']+)'/g)].map(m=>({id:m[1],name:m[2]}));const at=js.indexOf('const C =');const counts=jsLiteral<Record<string,number[][]>>(js,js.indexOf('{',at));const tasks=[...js.slice(js.indexOf('const TASKS ='),js.indexOf('const MODELS =')).matchAll(/id: '([^']+)', name: '([^']+)'/g)].map(m=>m[2]);const rows:LeaderboardRow[]=[];
 for(const m of models)for(const [ci,condition] of ['Unaltered','Blurred','Doctored'].entries()){const values=counts[m.id];if(values.length!==tasks.length)throw new Error('Task count mismatch');rows.push({model:m.name,score:values.reduce((s,r)=>s+r[ci],0)/(values.length*12)*100,setting:`${condition}; high`,metrics:{attempted:values.reduce((s,r)=>s+r[ci],0),trials:values.length*12}});for(const [i,r]of values.entries())rows.at(-1)!.metrics![tasks[i].toLowerCase().replace(/\W+/g,'_')]=r[ci]/12*100;}return rows;
 },
};
export default board;
