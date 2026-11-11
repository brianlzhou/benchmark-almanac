// Putnam-like: 96 problems, each graded 0–10. Use one consistent published Gemini judge across all problems.
// Read JSON members directly from the official archive; never extract or execute its code.
import { gunzipSync } from 'node:zlib';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED='https://codeload.github.com/google-deepmind/eval_hub/tar.gz/refs/heads/master';
const board:Leaderboard={benchmark:'putnam-like-google',url:'https://github.com/google-deepmind/eval_hub/tree/master/eval_hub/putnam_like',feed:FEED,
 terms:'Public Google DeepMind eval_hub graded samples. Benchmark Almanac credits Google DeepMind and links the source.',
 aliases:{'gemini-2.5-flash-04-17':'gemini-2-5-flash-apr-2025','gemini-2.5-pro-03-25':'gemini-2-5-pro-mar-2025','sonnet-3.7':'claude-3-7-sonnet'},
 async fetch():Promise<LeaderboardRow[]>{
  const res=await fetch(FEED,{headers:{'user-agent':'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)'},signal:AbortSignal.timeout(120000)});
  if(!res.ok)throw new Error(`Putnam-like archive: HTTP ${res.status}`);
  const tar=gunzipSync(Buffer.from(await res.arrayBuffer()),{maxOutputLength:256*1024*1024});
  const groups=new Map<string,Map<string,number>>();
  for(let offset=0;offset+512<=tar.length;){
   const h=tar.subarray(offset,offset+512);if(h.every(b=>b===0))break;
   const name=h.subarray(0,100).toString().split('\0')[0];const size=parseInt(h.subarray(124,136).toString().replace(/\0/g,'').trim(),8);
   if(!Number.isFinite(size)||size<0||offset+512+size>tar.length)throw new Error('Invalid Putnam-like archive member');
   const m=name.match(/\/putnam_like\/putnam_like\/(Set_\d+\/[AB]\d+)\/samples\/([^/]+)\/grade_gemini-2\.5-pro_20250718_sample(?:_1)?\.json$/);
   // GitHub uses POSIX prefix fields for these long names.
   const prefix=h.subarray(345,500).toString().split('\0')[0];
   const full=prefix?prefix+'/'+name:name;
   const match=m??full.match(/\/putnam_like\/putnam_like\/(Set_\d+\/[AB]\d+)\/samples\/([^/]+)\/grade_gemini-2\.5-pro_20250718_sample(?:_1)?\.json$/);
   if(match){const d=JSON.parse(tar.subarray(offset+512,offset+512+size).toString());
    if(d.reviewer_id!=='gemini-2.5-pro'||!Number.isFinite(d.grade)||d.grade<0||d.grade>10)throw new Error('Putnam-like grade or reviewer changed');
    if(!groups.has(match[2]))groups.set(match[2],new Map());groups.get(match[2])!.set(match[1],d.grade);
   }
   offset+=512+Math.ceil(size/512)*512;
  }
  const rows:LeaderboardRow[]=[];
  for(const [name,grades] of groups){if(grades.size!==96)throw new Error(`Incomplete Putnam-like sample set: ${name}`);
   const effort=name.match(/^(o[34]-mini)-(high)$/);const model=effort?effort[1]:name==='r1'?'DeepSeek R1 (snapshot unspecified)':name;
   rows.push({model,setting:effort?.[2],harness:'Published Gemini 2.5 Pro judge (2025-07-18)',score:[...grades.values()].reduce((a,b)=>a+b,0)/960*100,metrics:{problems:96,totalPoints:[...grades.values()].reduce((a,b)=>a+b,0)}});
  }
  if(!rows.length)throw new Error('Putnam-like grade files missing');return rows;
 }};
export default board;
