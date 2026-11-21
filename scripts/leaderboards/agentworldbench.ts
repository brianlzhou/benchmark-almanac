// AgentWorldBench: Overall is the official aggregate score on a 0–100 scale.
// Read seven domain scores and model metadata from the open-source release table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/QwenLM/Qwen-AgentWorld/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "agentworldbench",
 parts: {
   MCP: { name: 'MCP', group: 'Environment' },
   Search: { name: 'Search', group: 'Environment' },
   'Term.': { name: 'Terminal', group: 'Environment' },
   SWE: { name: 'SWE', group: 'Environment' },
   Android: { name: 'Android', group: 'Environment' },
   Web: { name: 'Web', group: 'Environment' },
   OS: { name: 'OS', group: 'Environment' },
 },
 url: "https://github.com/QwenLM/Qwen-AgentWorld",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const source = await fetchText(FEED);
  const tables = markdownTables(source);
  const releases = new Map(tables.find(t => t[0].join('|') === 'Release|Description')?.slice(1).map(r => [r[0], r[1]]));
  const license = source.match(/All open-weight models and AgentWorldBench are licensed under ([^\n]+?)\.\s/)?.[1];
  const t = tables.find(t=>t[0].includes('MCP') && t[0].includes('Overall'));
  if (!t) throw new Error('agentworldbench table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[8])!==undefined).map(r=>({
    ...(() => {
      const release = releases.get(r[0]);
      if (!release || !/model/i.test(release)) return {};
      const size = release.match(/([\d.]+)B total/i);
      return {open:true, license, params:size ? Number(size[1]) : undefined};
    })(),
    model:r[0], score:num(r[8])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==8 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('agentworldbench has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
