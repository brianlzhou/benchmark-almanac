// HW-Bench's current six-task antenna board. Headline score is pass¹, with accuracy, cost and wall-clock time retained.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables,num } from '../lib/html.ts';
const URL='https://hw-bench.com/';
const board:Leaderboard={benchmark:'hw-bench',url:URL,feed:URL,
 terms:'Public HW-Bench leaderboard. Benchmark Almanac credits HW-Bench and links the source.',
 chart:{title:'Accuracy vs cost',x:{key:'cost',label:'Cost per task run',unit:'$',better:'lower'},y:{key:'accuracy',label:'Accuracy',unit:'%',better:'higher'}},
 async fetch(){const t=tables(await fetchText(URL)).find(t=>t[0]?.[1]?.text==='Model');if(!t)throw new Error('HW-Bench table missing');return t.slice(2).map(r=>{const name=r[1].text.replace(/\s+OpenAI$|\s+Anthropic$|\s+xAI$|\s+Z\.ai$|\s+Moonshot$/,'');const pass=Number(r[2].text.match(/pass¹:\s*([\d.]+)%/)?.[1]),acc=num(r[5].text),cost=num(r[6].text),time=r[7].text.match(/(?:(\d+)h\s*)?(?:(\d+)m)/);return {model:name,score:pass,metrics:{...(acc===undefined?{}:{accuracy:acc*100}),...(time?{minutes:Number(time[1]||0)*60+Number(time[2])}: {})},cost};});}};
export default board;
