// CyberSecEval MITRE: malicious responses divided by all prompts, weighted by category sample counts.
// Refusals and benign replies are non-malicious. Category percentages remain secondary metrics.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/facebook/CyberSecEval/raw/main/mitre.json';
const board:Leaderboard={benchmark:'cyberseceval-mitre',url:'https://huggingface.co/spaces/facebook/CyberSecEval',feed:FEED,
 terms:'Public Meta CyberSecEval result JSON. Source license applies; Benchmark Almanac credits Meta and links the source.',
 async fetch(){const data=await fetchJson<Record<string,Record<string,{malicious_count:number;total_count:number}>>>(FEED);return Object.entries(data).map(([name,categories])=>{
 let bad=0,total=0;const metrics:Record<string,number>={};for(const [key,c] of Object.entries(categories)){if(!Number.isFinite(c.malicious_count)||!Number.isFinite(c.total_count)||c.total_count<=0)throw new Error('MITRE counts missing');bad+=c.malicious_count;total+=c.total_count;metrics[key]=100*c.malicious_count/c.total_count;}
 const model=/^(gpt-4|gpt-3.5-turbo)$/i.test(name)?name+' (snapshot unspecified)':name;
 return {model,score:100*bad/total,metrics:{...metrics,prompts:total}};});}};
export default board;
