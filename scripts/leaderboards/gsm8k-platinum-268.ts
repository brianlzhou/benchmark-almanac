import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {jsLiteral} from '../lib/html.ts';
import full from './gsm8k-platinum.ts';
const PAGE='http://platinum-bench.csail.mit.edu/';
const board:Leaderboard={benchmark:'gsm8k-platinum-268',url:PAGE,feed:PAGE+' (matrix bundle)',aliases:{...full.aliases,'gemini-2.5-pro-exp-03-25':'gemini-2-5-pro-mar-2025'},terms:'Official MIT result matrix. The Almanac credits and links the source.',async fetch(){
 const html=await fetchText(PAGE);
 for(const src of [...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(m=>m[1]))]){
  await new Promise(r=>setTimeout(r,1050));const s=await fetchText(new URL(src,PAGE).href),at=s.indexOf('gsm8k:['),names=s.indexOf(',o=[');
  if(at<0||names<0)continue;
  if(!s.includes('key:"gsm8k",type:"Math",count:"268"'))throw new Error('Initial subset size changed');
  const errors=jsLiteral<number[]>(s,at+6),labels=jsLiteral<string[]>(s,names+3);
  if(errors.length!==labels.length)throw new Error('Matrix columns disagree');
  const mapAt=s.indexOf(',s={',names);if(mapAt<0)throw new Error('Model identity map missing');
  const identities=jsLiteral<Record<string,string>>(s,mapAt+3);
  return labels.map((label,i)=>{let model=identities[label];if(!model)throw new Error('Missing model identity');let setting:string|undefined;const effort=model.match(/-(high|med|thinking)$/);if(effort){setting=effort[1]==='med'?'medium':effort[1];model=model.slice(0,-effort[0].length);}if(label.includes('Thinking 16k'))setting='thinking; 16k';if(label.includes('(high)'))setting='high';if(/^(mistral-(small|large)|gemini-1\.5-(pro|flash)|gpt-4o-mini|gemini-2\.0-flash|deepseek-r1|deepseek\/deepseek-chat)$/.test(model))model+=' (snapshot unspecified)';return {model,setting,score:(268-errors[i])/268*100,metrics:{errors:errors[i],questions:268}};});
 }
 throw new Error('GSM8K matrix bundle missing');
}};export default board;
