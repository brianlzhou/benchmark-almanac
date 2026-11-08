// PlatinumBench's displayed GSM8K subset contains 268 curated questions. Its accuracy toggle computes
// 100 * (1 - errors/questions). Read the live bundle's model order, errors and denominator without executing it.
// This is the displayed subset, not the later full GSM8K-Platinum release.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const URL='http://platinum-bench.csail.mit.edu/';
const board:Leaderboard={benchmark:'gsm8k-platinum',url:URL,feed:URL,terms:'Public MIT PlatinumBench source data, subject to the project license and site terms.',async fetch(){
 const html=await fetchText(URL);let source='';
 for(const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)){
  const s=await fetchText(new URL(m[1],URL).href);if(/gsm8k:\[/.test(s)){source=s;break;}
 }
 const errors=source.match(/gsm8k:(\[[\d,]+\])/),count=source.match(/key:"gsm8k",type:"Math",count:"(\d+)"/);
 const mapping=[...source.matchAll(/\{(?:"[^"\\]+":"[^"\\]+",?)+\}/g)].map(m=>JSON.parse(m[0])).find(o=>o['GPT-4o (Nov)']);
 if(!errors||!count||!mapping)throw new Error('Missing live PlatinumBench matrix');
 const names=[...source.matchAll(/\[(?:"[^"\\]+",?)+\]/g)].map(m=>JSON.parse(m[0]) as string[]).find(a=>a.length>10&&a.every(n=>mapping[n]));
 const values=JSON.parse(errors[1]) as number[],questions=Number(count[1]);if(!names||names.length!==values.length)throw new Error('Platinum matrix dimensions changed');
 return names.map((name,i):LeaderboardRow=>{
  let model=mapping[name],setting=`display subset; ${questions} questions`;
  const effort=name.match(/\((high|med)\)/i)?.[1]??(/Thinking 16k/.test(name)?'thinking 16k':undefined);if(effort)setting+='; '+effort;
  model=model.replace(/-(high|med|thinking)$/,'');
  if(/^(gemini-1\.5-(pro|flash)|gemini-2\.0-flash|deepseek\/deepseek-chat|mistral-(large|small))$/.test(model))model+=' (snapshot unspecified)';
  return {model,score:100*(1-values[i]/questions),setting,metrics:{errors:values[i],questions}};
 });
}};
export default board;
