// PRDBench reports development and debugging scores for minimal and commercial agents.
// Stages remain separate; commercial system identities are not attributed to guessed backbones.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/AGI-Eval-Official/PRDBench/main/README.md";
const board: Leaderboard = {
 benchmark: "prdbench", url: "https://github.com/AGI-Eval-Official/PRDBench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head[0]==='Agent Type');if(!t)throw new Error('No PRDBench results');return t.rows.flatMap(r=>[1,2].flatMap(i=>{const score=num(r[i+1]);if(score===undefined)return [];let model=r[1];if(['Gemini-3-Pro','Claude-4.5','Qwen3-Coder','Kimi-K2'].includes(model))model+=' [snapshot unspecified]';if(r[0]==='Commercial')model+=' [agent system]';return [{model,score,harness:r[0]==='Commercial'?r[1]:'Minimal',setting:i===1?'DEV':'DEBUG',metrics:{enhancement:num(r[4])!}}];}));
 },
};
export default board;
