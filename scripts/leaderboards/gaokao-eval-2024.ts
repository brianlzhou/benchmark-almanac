// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The authors rank models by science total on both 2024 exam papers. The national A humanities total excludes politics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://raw.githubusercontent.com/open-compass/GAOKAO-Eval/HEAD/README.md';
const fields:Record<string,string>={'语文':'Chinese','数学':'Mathematics','英语':'English','物理':'Physics','化学':'Chemistry','生物':'Biology',
  '历史':'History','地理':'Geography','政治':'Politics','数学（理）':'Science mathematics','数学（文）':'Humanities mathematics',
  '理科总分':'Science total','文科总分':'Humanities total','文科总分(缺政治)':'Humanities total (excluding politics)'};
const names=['New Curriculum','National A'];
const pairs:Record<string,string[]>={
 'InternLM-WQX+VL-20B':['InternLM2-WQX-20B','InternLM2-WQX-VL-20B'],'Qwen2-72B+VL-7B':['Qwen2-72B-Instruct','Qwen-VL-Chat'],
 'Qwen2-57B+VL-7B':['Qwen2-57B-A14B-Instruct','Qwen-VL-Chat'],'Yi-34B+VL-34B':['Yi-1.5-34B-Chat','Yi-VL-34B'],
 'GLM4-9B+VL-9B':['GLM-4-9B-Chat','GLM-4V-9B']};
const board:Leaderboard={
 benchmark:'gaokao-eval-2024',url:'https://github.com/open-compass/GAOKAO-Eval',feed,terms:'OpenCompass publishes the source tables at https://github.com/open-compass/GAOKAO-Eval.',
 aliases:{'GPT-4o (snapshot unspecified)':'gpt-4o-may-2024','Qwen2-72B纯文本':'qwen2-72b'},
 headline:'The authors rank each paper by science total. The headline averages the New Curriculum and National A science totals.',
 parts:Object.fromEntries(names.flatMap((name,i)=>Object.entries(fields).filter(([k])=>
   i===0?!['数学（理）','数学（文）','文科总分(缺政治)'].includes(k):!['数学','政治','文科总分'].includes(k)).map(([key,value])=>[i+key,name+' '+value]))),
 async fetch(){
   const ts=tables(await fetchText(feed)).map(t=>t.map(r=>r.map(c=>c.text)));
   const runs=new Map<string,LeaderboardRow>();
   for(const [i,prefix] of ['新课标','全国甲卷'].entries()){
     const t=ts.find(t=>t[0]?.[0]?.startsWith(prefix) && t[1]?.includes('理科总分'));
     if(!t) throw new Error('Missing GAOKAO-Eval paper '+prefix);
     for(const [model,,...cells] of t.slice(2)){
       const row=runs.get(model)??{model,score:0,metrics:{},models:pairs[model]};
       cells.forEach((v,j)=>{
         const key=t[1][j+2],value=v.replace(/<\/$/,'');
         if(!fields[key] || !/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid GAOKAO subject value '+v);
         row.metrics![i+key]=Number(value);
       });
       runs.set(model,row);
     }
   }
   for(const row of runs.values()) row.score=(row.metrics!['0理科总分']+row.metrics!['1理科总分'])/2;
   return checked([...runs.values()],8);
 },
};
export default board;
