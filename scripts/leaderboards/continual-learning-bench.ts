// Continual Learning Bench: published aggregate normalized reward over six task sequences.
// Avg Cost is evaluation spend, retained as a metric because the page does not establish a per-instance denominator.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables,num } from '../lib/html.ts';
const URL='https://snorkel.ai/leaderboard/continual-learning-bench/';
const board:Leaderboard={benchmark:'continual-learning-bench',url:URL,feed:URL,
 terms:'Snorkel terms prohibit automated extraction and republication; Benchmark Almanac credits Snorkel AI and links the source.',
 chart:{title:'Aggregate reward vs. average evaluation cost',x:{key:'evaluationCost',label:'Average evaluation cost',unit:'$',better:'lower'},y:{key:'score',label:'Aggregate reward',better:'higher'}},
 async fetch(){const t=tables(await fetchText(URL)).find(t=>t[0]?.some(c=>c.text==='Avg Reward'));if(!t)throw new Error('Continual Learning aggregate table missing');return t.slice(1).map(r=>{const [harness,name]=r[1].text.split(' · ');return {model:/^(Sonnet|Opus|Fable|Haiku)\b/.test(name)?'Claude '+name:name,harness,score:num(r[2].text)!,metrics:{gain:num(r[3].text)!,evaluationCost:num(r[4].text)!}};});}};
export default board;
