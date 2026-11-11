// BTF-2's five-agent Brier table remains below BTF-3. Never use the newer pooled-score table here.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL='https://evals.futuresearch.ai/';
const board:Leaderboard={benchmark:'btf-2',url:URL,feed:URL+' (BTF-2 Brier accuracy table)',
 terms:'Official FutureSearch results; source terms apply and the Almanac credits and links the source.',
 async fetch(){const t=tables(await fetchText(URL)).find(t=>t[0].some(c=>c.text==='Calibration'));
 if(!t)throw new Error('BTF-2 table missing');return t.slice(1).map(r=>{
 let model=r[0].text.replace(/ Agent$/,'');if(model.startsWith('Opus '))model='Claude '+model;
 if(model==='Grok 4.20 Beta')model+=' (snapshot unspecified)';
 return {model,score:num(r[1].text)!,harness:'FutureSearch agent',metrics:{calibration:num(r[2].text)!,refinement:num(r[3].text)!}};});}};
export default board;
