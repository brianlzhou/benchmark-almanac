// CyberSecEval Instruct secure-code pass rate, weighted by language trial counts.
// Autocomplete results are not part of this benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/facebook/CyberSecEval/raw/main/insecure_code.json";
const board: Leaderboard = {
 benchmark: "cyberseceval-instruct", url: "https://huggingface.co/spaces/facebook/CyberSecEval/raw/main/insecure_code.json", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const data=await fetchJson<Record<string,Record<string,Record<string,number>>>>(FEED);
const rows:LeaderboardRow[]=[];
for(const [model,langs] of Object.entries(data)) {
 let n=0,bad=0;const metrics:Record<string,number>={};
 for(const [lang,d] of Object.entries(langs)) {
 const count=d.instruct_total_count, vulnerable=d.instruct_vunerable_suggestion_count;
 if(!Number.isFinite(count)||!Number.isFinite(vulnerable)||count<=0)continue;
 n+=count;bad+=vulnerable;metrics[lang+' secure (%)']=100*(1-vulnerable/count);metrics[lang+' trials']=count;
 }
 if(n)rows.push({model:/^gpt-/i.test(model)?model+' [snapshot unspecified]':model,score:100*(1-bad/n),setting:'Instruct',metrics:{...metrics,trials:n}});
}return rows;
 },
};
export default board;
