// Gray Swan Agent Red-Teaming snapshot: ASR is attack success rate in percent, where lower is safer.
// The model table is distinct from human competitor rankings. Attack/chat counts and anonymized configuration labels are retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://www.grayswan.ai/blog/uk-aisi-x-gray-swan-agent-red-teaming-challenge-results-snapshot";
const board: Leaderboard = {
 benchmark: "gray-swan-art-benchmark",
 url: "https://www.grayswan.ai/blog/uk-aisi-x-gray-swan-agent-red-teaming-challenge-results-snapshot",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='ASR') && t[0]?.some(c=>c.text==='Model'));
  if(!t)throw new Error('Gray Swan model results missing');
  return t.slice(1).filter(r=>num(r[4]?.text)!==undefined).map(r=>{
    const alias=r[1].text.match(/\s*\(([^)]+)\)$/);let model=r[1].text.replace(/^[^/]+\//,'').replace(/\s*\([^)]+\)$/,'');
    const thinking=model.endsWith(':thinking');model=model.replace(/:thinking$/,'');
    return {model,score:num(r[4].text)!,setting:[thinking?'thinking':null,alias?.[1]].filter(Boolean).join('; '),metrics:{breaks:num(r[2].text)!,chats:num(r[3].text)!}};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
