// Public Cekura page data. Read JSON literals as data, never execute downloaded JavaScript.
import type {Leaderboard,LeaderboardRow} from '../../leaderboards/types.ts';
import {fetchText} from '../util.ts';
import {tables,num} from '../html.ts';
async function embedded(url:string, predicate:(v:any)=>boolean):Promise<any>{
 const html=await fetchText(url);
 const chunks=[...new Set([...html.matchAll(/src="([^\"]+\.js[^\"]*)"/g)].map(m=>new URL(m[1].replace(/&amp;/g,'&'),url).href))];
 for(const chunk of chunks){
  await new Promise(r=>setTimeout(r,1050));const src=await fetchText(chunk);
  for(const m of src.matchAll(/JSON\.parse\('((?:[^'\\]|\\.)*)'\)/g)){
   let v:any;try{v=JSON.parse(m[1].replace(/\\(['\\])/g,'$1'));}catch{continue;}
   if(predicate(v))return v;
  }
 }
 throw new Error('Cekura embedded results missing');
}
const terms='Cekura publishes benchmark methods and results. The almanac credits Cekura and links the source.';
export function cekuraBoard(benchmark:string,kind:string):Leaderboard{
 const paths:Record<string,string>={agent:'speech-to-speech',real:'speech-to-speech/real-calls',turn:'speech-to-speech/turn-bench',stt:'stt',tts:'text-to-speech',workflows:'voice-agent-workflows',production:'experiments/production-voice-agents'};
 const url='https://benchmarks.cekura.ai/'+paths[kind];
 return {benchmark,url,feed:url+' (embedded published results)',terms,
 ...(kind==='agent'||kind==='real'?{chart:{title:'Reliability vs. cost per call',x:{key:'cost',label:'Cost per call',unit:'$',better:'lower' as const},y:{key:'score',label:'Pass³',unit:'%',better:'higher' as const}}}:{}),
 async fetch():Promise<LeaderboardRow[]>{
 let rows:LeaderboardRow[]=[];
 if(kind==='agent'||kind==='real'){
  const d=await embedded(url,v=>Array.isArray(v.results)&&Array.isArray(v.suites)&&v.results.some((r:any)=>r.suite==='all'&&r.passAll));
  rows=d.results.filter((r:any)=>r.suite==='all').map((r:any)=>{const m=d.models.find((m:any)=>m.id===r.model);if(!m)throw new Error('Unknown Cekura model');return {model:m.name,setting:[m.setting,m.baseline?'reference baseline':null].filter(Boolean).join('; '),score:100*r.passAll.overall/r.scenarios,date:d.generatedAt.slice(0,10),cost:r.costPublished&&typeof r.costPerCallUsd==='number'?r.costPerCallUsd:undefined,metrics:{pass1Percent:100*r.overallPass/r.runs,taskSuccessPercent:100*r.taskPass/r.runs,responseMedianMs:r.latencyP50Ms,responseP95Ms:r.latencyP95Ms,...(typeof r.elo==='number'?{elo:r.elo}:{}),...(typeof r.costPerMinuteUsd==='number'?{costPerMinuteUsd:r.costPerMinuteUsd}:{}),...Object.fromEntries(Object.entries(r.families??{}).map(([k,v])=>[k+'Percent',v]))}};});
 }else if(kind==='stt'){
  const d=await embedded(url,v=>v.benchmark?.results?.some((r:any)=>typeof r.overallWer==='number'));
  rows=d.benchmark.results.map((r:any)=>({model:r.model,score:r.overallWer,date:d.generatedAt?.slice(0,10),metrics:{publicWerPercent:r.publicWer,privateWerPercent:r.privateWer,firstTextMedianMs:r.ttftP50,finalTextMedianMs:r.ttfsP50,priceUsdPerHour:r.priceUsdPerHour,failed:r.failed,clipsIncluded:r.overallIncluded}}));
 }else if(kind==='tts'){
  const d=await embedded(url,v=>v.campaign&&Array.isArray(v.results)&&v.results.some((r:any)=>r.accuracy));
  rows=d.results.flatMap((r:any)=>{const m=d.models.find((m:any)=>m.id===r.id);const a=Object.values(r.accuracy??{}).filter((a:any)=>typeof a.oneShot?.wer==='number') as any[];if(!m||!a.length)return [];
   const mean=(f:(a:any)=>number)=>a.reduce((s,a)=>s+f(a),0)/a.length;
   return [{model:m.vendor+' '+m.name,score:100*mean(a=>a.oneShot.wer),setting:'voice '+m.voice,date:d.generatedAt.slice(0,10),metrics:{hardPartsPercent:100*mean(a=>a.spans.all.rate),naturalnessMean1to5:r.naturalness?.mos?.mean,firstAudioMedianMs:r.latency?.ttfa?.p50,priceUsdPerMillionChars:m.price?.usdPerMillionChars,...Object.fromEntries(a.map((a:any)=>['werPercent_'+a.model,100*a.oneShot.wer]))}}];});
 }else if(kind==='turn'){
  const d=await embedded(url,v=>v.results?.private?.endOfTurn&&v.models);
  const rs=d.results.private.endOfTurn;
  rows=Object.entries(d.models).flatMap(([name,m]:[string,any])=>{const a=rs.filter((r:any)=>r.model===name);if(a.length!==6)return [];return [{model:name,setting:m.status==='ranked'?m.setup?.settings:'reference baseline',score:100*a.reduce((s:number,r:any)=>s+r.overall,0)/a.length,date:d.generatedAt.slice(0,10),metrics:Object.fromEntries(a.flatMap((r:any)=>[[r.condition+'Percent',100*r.overall],[r.condition+'ResponseMedianMs',r.latencyP50Ms]]))}];});
 }else{
  const ts=tables(await fetchText(url));const t=ts.find(t=>t[0]?.some(c=>c.text.includes(kind==='workflows'?'Reliability':'Composite')));if(!t)throw new Error('Cekura table missing');
  rows=t.slice(1).filter(r=>num(r[1]?.text)!==undefined).map(r=>({model:r[0].text.replace(/^\d+\s+/,''),score:num(r[1].text)!,metrics:Object.fromEntries(r.slice(2).map((c,j)=>[t[0][j+2].text,num(c.text)]).filter((x):x is [string,number]=>typeof x[1]==='number'))}));
 }
 if(!rows.length||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid Cekura rows');return rows;
 }};
}
