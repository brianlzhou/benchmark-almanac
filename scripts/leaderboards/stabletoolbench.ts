// StableToolBench: latest MirrorAPI average solvable pass rate, the first headline table.
// FAC is a secondary metric. Exclude legacy GPT-cache results and retain CoT/DFS harnesses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/THUNLP-MT/StableToolBench/master/README.md";
const board: Leaderboard = {
 benchmark: "stabletoolbench",
 url: "https://github.com/THUNLP-MT/StableToolBench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const ts=markdownTables(await fetchText(FEED)).filter(t=>t[0].includes('Average'));
if (ts.length < 2) throw new Error('MirrorAPI result tables missing');
return ts[0].slice(1).filter(r=>num(r[7])!==undefined).map(r=>{
  const m=r[0].match(/\s*\(?((?:CoT|DFS))\)?$/);
  const fac=ts[1].slice(1).find(v=>v[0]===r[0]);
  return {model:r[0].replace(/\s*\(?(CoT|DFS)\)?$/,''),harness:m?.[1],score:num(r[7])!,
    metrics:{...Object.fromEntries(ts[0][0].slice(1,7).map((k,j)=>[k,num(r[j+1])!])),
      ...(fac && num(fac[7])!==undefined ? {fac:num(fac[7])!} : {})}};
});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
