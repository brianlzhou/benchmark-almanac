// TSP-Opt: mean optimal-tour correctness across runs, as percentages.
// Reads only current archive summaries using ZIP byte ranges. Completion usage is output tokens per instance.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { inflateRawSync } from 'node:zlib';
type Entry={name:string;offset:number;size:number;method:number};
let lastRequest=0;
async function range(url:string,span:string):Promise<Buffer>{
 await new Promise(r=>setTimeout(r,Math.max(0,lastRequest+2100-Date.now())));lastRequest=Date.now();
 const r=await fetch(url,{headers:{'user-agent':'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)',Range:'bytes='+span},signal:AbortSignal.timeout(60000)});
 if(r.status!==206)throw new Error('ZIP server requires byte ranges: '+r.status);
 return Buffer.from(await r.arrayBuffer());
}
async function directory(url:string):Promise<Entry[]>{
 const b=await range(url,'-131072');const end=b.lastIndexOf(Buffer.from([80,75,5,6]));if(end<0)throw new Error('Missing ZIP directory');
 const size=b.readUInt32LE(end+12);const offset=b.readUInt32LE(end+16);
 const cd=size<=end?b.subarray(end-size,end):await range(url,offset+'-'+(offset+size-1));const entries:Entry[]=[];
 for(let p=0;p+46<=cd.length;){
 if(cd.readUInt32LE(p)!==0x02014b50)throw new Error('Invalid ZIP directory');
 const nl=cd.readUInt16LE(p+28),el=cd.readUInt16LE(p+30),cl=cd.readUInt16LE(p+32);
 entries.push({name:cd.subarray(p+46,p+46+nl).toString(),offset:cd.readUInt32LE(p+42),size:cd.readUInt32LE(p+20),method:cd.readUInt16LE(p+10)});p+=46+nl+el+cl;
 }return entries;
}
async function entry(url:string,e:Entry):Promise<string>{
 const b=await range(url,e.offset+'-'+(e.offset+30+Buffer.byteLength(e.name)+e.size+2048));
 if(b.readUInt32LE(0)!==0x04034b50)throw new Error('Invalid ZIP entry');
 const start=30+b.readUInt16LE(26)+b.readUInt16LE(28);const body=b.subarray(start,start+e.size);
 if(e.method!==0&&e.method!==8)throw new Error('Unsupported ZIP method');
 return (e.method===8?inflateRawSync(body):body).toString();
}

const FEED = "https://huggingface.co/api/datasets/microsoft/Eureka-Bench-Logs/tree/main/TSP";
const board: Leaderboard = {
 benchmark: "tsp-opt", url: "https://huggingface.co/datasets/microsoft/Eureka-Bench-Logs", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 aliases: {'claude-3-5-sonnet-20241022':'claude-3-5-sonnet-october-2024','Meta-Llama-3.1-405B-Instruct':'llama-3-1-405b','deepseek-ai/DeepSeek-R1':'deepseek-r1'},
 async fetch() {
const files=await fetchJson<{path:string;type:string}[]>(FEED);const rows:LeaderboardRow[]=[];
for(const f of files.filter(x=>x.type==='file'&&x.path.endsWith('.zip'))) {
 const url='https://huggingface.co/datasets/microsoft/Eureka-Bench-Logs/resolve/main/'+f.path;
 const entries=await directory(url);
 for(const e of entries.filter(e=>/\/eval_report\/.*NPHardTSPMetric_AllRuns_report\.json$/.test(e.name))) {
 const root=e.name.split('/eval_report/')[0];
 const config=entries.find(x=>x.name===root+'/config.txt');if(!config)throw new Error('Missing run config');
 const c=await entry(url,config);
 const model=c.match(/['"](?:model_name|model_name_or_path|model_id)['"]\s*:\s*['"]([^'"]+)/)?.[1] ?? (c.includes('Meta-Llama-3-1-405B-Instruct-2.eastus.models.ai.azure.com')?'Meta-Llama-3.1-405B-Instruct':undefined);
 if(!model)throw new Error('Missing model identity in '+root);
 const result=JSON.parse(await entry(url,e))[0]?.NPHardTSPMetric_result?.correct;
 if(!Number.isFinite(result?.mean))throw new Error('Missing correctness mean');
 const usage=entries.find(x=>x.name.startsWith(root+'/eval_report/')&&x.name.endsWith('UsageCompletion_AllRuns_report.json'));
 let tokens:number|undefined;
 if(usage){const u=JSON.parse(await entry(url,usage));tokens=u[0]?.usage_completion?.mean;}
 const effort=c.match(/['"]reasoning_effort['"]\s*:\s*['"]([^'"]+)/)?.[1];
 const budget=c.match(/['"]thinking_budget['"]\s*:\s*(\d+)/)?.[1];
 rows.push({model,score:result.mean*100,tokens:Number.isFinite(tokens)?tokens:undefined,setting:['mean across runs',effort,budget?'thinking budget '+budget:undefined,root].filter(Boolean).join('; '),metrics:{'standard deviation (%)':result.std*100}});
 }
}if(!rows.length)throw new Error('No TSP summaries');return rows;
 },
};
export default board;
