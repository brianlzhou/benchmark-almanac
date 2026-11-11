import type {Leaderboard} from '../../leaderboards/types.ts';
import {fetchText} from '../util.ts';
import {tables,num} from '../html.ts';
const PAGE='https://snorkel.ai/leaderboard/mbabench-2/';
export function mbaBoard(id:string,index=0):Leaderboard {return {benchmark:id,url:PAGE,feed:PAGE,terms:'Snorkel terms restrict copying and automated extraction. The Almanac credits Snorkel and the MBABench authors and links the source.',aliases:{'Fable 5.1':'claude-fable-5-1','Opus 5':'claude-opus-5','Astra':'gpt-6-astra'},async fetch(){
 const ts=tables(await fetchText(PAGE)).filter(t=>t[0]?.[4]?.text==='Pass rate');const t=ts[index];if(!t)throw new Error('MBA table missing');
 return t.slice(1).map(r=>{const c=r.map(c=>c.text);const score=num(c[4]);if(score===undefined)throw new Error('MBA pass rate missing');const counts=c[8].split('/').map(Number);const model=/^(Sol|Gemini 3.8|Qwen 3.8)$/.test(c[1])?c[1]+' (variant unspecified)':c[1];return {model,score,harness:c[2],setting:c[3]==='n/a'?undefined:c[3],metrics:{passStandardError:num(c[5].replace('±',''))!,numericalAccuracy:num(c[6])!,accuracyStandardError:num(c[7].replace('±',''))!,passed:counts[0],tasks:counts[1]}}});
}};}
