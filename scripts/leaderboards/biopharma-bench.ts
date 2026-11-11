// Biopharma Bench V0.2 scores mean rubric fulfillment across 81 tasks.
// Cost is USD per task, output time converts minutes to seconds, and full-pass counts remain secondary.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://eval.raycaster.ai/benchmarks/biopharma-bench/";
const board: Leaderboard = {
 benchmark: "biopharma-bench", url: "https://eval.raycaster.ai/benchmarks/biopharma-bench/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 aliases:{'Muse Wonder 1.0':'muse-wonder'},
 chart:{title:'Mean rubric score vs. cost',x:{key:'cost',label:'Mean task cost',unit:'$',better:'lower'},y:{key:'score',label:'Mean rubric score',unit:'%',better:'higher'}},
 async fetch() {
const t=tables(await fetchText(FEED))[0];if(!t?.[0]?.some(c=>c.text.includes('Mean score')))throw new Error('Missing board');return t.slice(1).flatMap(r=>{const score=num(r[2]?.text);const m=r[1]?.text.match(/^(.*?) (Codex|Claude Code|Cursor CLI|Gemini CLI|Pi) · (.+)$/);if(score===undefined||!m)throw new Error('Unexpected model configuration');const cost=num(r[4].text);const pass=r[3].text.match(/(\d+) \/ (\d+)/);return [{model:m[1],harness:m[2],setting:`V0.2; ${m[3]}; 81 tasks`,score,cost,metrics:{cost:cost!,steps:num(r[5].text)!,toolCalls:num(r[6].text)!,latency:num(r[7].text)!*60,...(pass?{fullPassCount:+pass[1],tasks:+pass[2],pass1:+pass[1]/+pass[2]*100}:{pass1:num(r[3].text)!}),ciMargin:Number(r[2].text.split('±')[1]?.trim())}}];});
 },
};
export default board;
