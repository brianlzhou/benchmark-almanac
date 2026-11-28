// ExtractBench published ranked systems and overall value F1 percentage. Cost_Per_Page is USD in the CSV (the README multiplies by 100 for cents); it remains a per-page metric, not per-document task cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { withKaggle } from '../lib/boards/kaggle.ts';

const FEED = "https://raw.githubusercontent.com/run-llama/ExtractBench/main/leaderboard.csv";
const board: Leaderboard = {
 benchmark: "extractbench",
 parts: {
   Short: { name: 'Short', group: 'Difficulty' },
   Medium: { name: 'Medium', group: 'Difficulty' },
   Long: { name: 'Long', group: 'Difficulty' },
 },
 url: "https://github.com/run-llama/ExtractBench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 stats: { P_Short: { name: 'Precision on short documents', unit: '%', better: 'higher' }, P_Medium: { name: 'Precision on medium documents', unit: '%', better: 'higher' }, P_Long: { name: 'Precision on long documents', unit: '%', better: 'higher' }, R_Short: { name: 'Recall on short documents', unit: '%', better: 'higher' }, R_Medium: { name: 'Recall on medium documents', unit: '%', better: 'higher' }, R_Long: { name: 'Recall on long documents', unit: '%', better: 'higher' }, Word_Grounding: { name: 'Word grounding', unit: '%', better: 'higher' }, Word_Grounding_Short: { name: 'Word grounding on short documents', unit: '%', better: 'higher' }, Word_Grounding_Medium: { name: 'Word grounding on medium documents', unit: '%', better: 'higher' }, Word_Grounding_Long: { name: 'Word grounding on long documents', unit: '%', better: 'higher' }, Page_Grounding: { name: 'Page grounding', unit: '%', better: 'higher' }, Page_Grounding_Short: { name: 'Page grounding on short documents', unit: '%', better: 'higher' }, Page_Grounding_Medium: { name: 'Page grounding on medium documents', unit: '%', better: 'higher' }, Page_Grounding_Long: { name: 'Page grounding on long documents', unit: '%', better: 'higher' }, Latency_S_Per_Doc_Short: { name: 'Latency per short document', unit: 'seconds', better: 'lower' }, Latency_S_Per_Doc_Medium: { name: 'Latency per medium document', unit: 'seconds', better: 'lower' }, Latency_S_Per_Doc_Long: { name: 'Latency per long document', unit: 'seconds', better: 'lower' }, Cost_Per_Page: { name: 'Cost per page', unit: 'usd', better: 'lower' }, Cost_Short: { name: 'Cost for short documents', unit: 'usd', better: 'lower' }, Cost_Medium: { name: 'Cost for medium documents', unit: 'usd', better: 'lower' }, Cost_Long: { name: 'Cost for long documents', unit: 'usd', better: 'lower' }, Grounding_Added_Cost_Per_Page: { name: 'Added cost per page for grounding', unit: 'usd', better: 'lower' }, Confidence_Added_Cost_Per_Page: { name: 'Added cost per page for confidence', unit: 'usd', better: 'lower' }, Confidence_Coverage: { name: 'Confidence coverage', unit: '%', better: 'higher', note: 'Coverage of fields with confidence scores.' }, Confidence_AUGRC: { name: 'Confidence area under gain-risk curve', unit: 'score', better: 'lower' } },

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
return parseCsv(await fetchText(FEED)).filter(r=>r.Provider&&r.include_in_rankings==='true'&&num(r.Overall)!==undefined).map(r=>{const agent=r.Provider.match(/^(Claude Code|Codex) \(([^)]+)\)$/);let model=agent?agent[2]:r.Provider;if(agent?.[1]==='Claude Code')model='Claude '+model;return {model,score:num(r.Overall)!,harness:agent?.[1]??r.Pipeline,setting:r.Reasoning||undefined,metrics:Object.fromEntries(Object.entries(r).filter(([k])=>!['Provider','Category','Pipeline','Reasoning','include_in_rankings','Overall'].includes(k)).map(([k,v])=>[k,num(v)]).filter((p):p is [string,number]=>typeof p[1]==='number'))};});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default withKaggle(board, { owner: 'llamaindex-org', slug: 'extractbench', task: 'extractbench-full', scale: 100 });
