// Data Agent Benchmark Pass@1 from the current official README, converted from fractions.
// Preserves agent identity, model combinations, effort, hints, prompt tuning, trials and submission date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/ucbepic/DataAgentBench/main/README.md";
const board: Leaderboard = {
 benchmark: "data-agent-benchmark", url: "https://github.com/ucbepic/DataAgentBench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head.some(h=>h.startsWith('Pass@1')));if(!t)throw new Error('Missing DAB table');const rows:LeaderboardRow[]=[];
for(const r of t.rows){const score=num(r[3]);if(score===undefined)continue;
 const name=r[1].replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,'').trim();const groups=[...name.matchAll(/\(([^()]+)\)/g)];const g=groups.at(-1);let model=name,harness:string|undefined,effort:string|undefined;
 if(g&&/Claude|GPT|Gemini|Qwen|GLM|DeepSeek|Muse|Fable|gpt-oss/i.test(g[1])){harness=name.slice(0,g.index).trim();model=g[1];const e=model.match(/,\s*(\w+) effort/);if(e){effort=e[1];model=model.replace(e[0],'');}}
 if(model.includes('+'))model+=' [combined system]';
 if(/^(Kimi-K2|Gemini-2\.[05]-Flash)$/.test(model))model+=' [snapshot unspecified]';
 const trials=/^\d+$/.test(r[4])?Number(r[4]):undefined;
 rows.push({model,score:score*100,harness,date:r[6],setting:['Pass@1',effort,'tuned prompt: '+(r[2].includes('✓')?'yes':'no'),'hints: '+(r[5].includes('✓')?'yes':'no'),'trials: '+r[4]].filter(Boolean).join('; '),metrics:trials===undefined?undefined:{trials}});
}return rows;
 },
};
export default board;
