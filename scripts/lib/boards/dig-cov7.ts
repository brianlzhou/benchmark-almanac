// Parse literal game-win data without evaluating downloaded JavaScript.
// The agentic harnesses only attempted tiers 6 and 7. They never become 70-game scores.
import type { Leaderboard } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { jsLiteral } from '../html.ts';
interface Row {label:string;kind:string;beaten:number;total:number;attempted:number;beatenByTier:number[];attemptedByTier:number[]}
export function digBoard(hard=false):Leaderboard {
 const PAGE='https://digbench.ai/';
 return {benchmark:hard?'dig-bench-tiers-6-7':'dig-bench',url:PAGE,feed:PAGE+' (Next.js totalGames:70 results array)',terms:'Official DiG-bench public results; the Almanac credits and links the source.',
 async fetch(){
  const html=await fetchText(PAGE);let rows:Row[]|undefined;
  for(const src of [...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(m=>m[1]))]){
   if(!src.startsWith('/_next/'))continue;
   await new Promise(r=>setTimeout(r,1050));const js=await fetchText(new URL(src,PAGE).href),marker='totalGames:70,rows:',at=js.indexOf(marker);
   if(at>=0){rows=jsLiteral<Row[]>(js.slice(at+marker.length).replace(/([[:,])\.(\d)/g,'$10.$2').replace(/!0/g,'true').replace(/!1/g,'false'),0);break;}
  }
  if(!rows)throw new Error('DiG results array missing');
  return rows.filter(r=>r.kind!=='human'&&(hard?r.attemptedByTier[5]===10&&r.attemptedByTier[6]===10:r.total===70&&r.attempted===70)).map(r=>{
   const [name,harness]=r.label.split(' + '),m=name.match(/^(.*?)\s+(high|max|medium|low)$/i);let model=m?m[1]:name;
   if(/^(Opus|Fable|Sonnet) /.test(model))model='Claude '+model;
   if(model==='DeepSeek V4 Pro Preview')model+=' (unlisted preview)';
   return {model,setting:m?.[2],harness:harness||'Basic',score:hard?(r.beatenByTier[5]+r.beatenByTier[6])/20*100:r.beaten/70*100,metrics:Object.fromEntries(r.beatenByTier.map((v,i)=>['tier'+(i+1),v/10*100]))};
  });
 }};
}
