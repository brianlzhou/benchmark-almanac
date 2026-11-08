// OSWorld-Science: the latest release, all-domain partial score is the headline percentage.
// Domain scores are metrics; reasoning is the configuration. Costs and output tokens are per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://discoailab.github.io/osworld-science-page/static/js/osciData.js";
const board: Leaderboard = {
 benchmark: "osworld-science",
 url: "https://discoailab.github.io/osworld-science-page/static/js/osciData.js",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 chart:{title:'Partial score versus task cost',x:{key:'cost',label:'Cost per task',unit:'$',better:'lower'},y:{key:'score',label:'Partial score',unit:'%',better:'higher'}},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const d=jsonAfter<any>(await fetchText(FEED),'window.OSCI =');const latest=[...new Set(d.leaderboard.results.map((r:any)=>r.releaseVersion))].sort().at(-1);return d.leaderboard.results.filter((r:any)=>r.releaseVersion===latest&&r.datasetScope==='all'&&Number.isFinite(r.partialScore)).map((r:any)=>({model:r.model,score:r.partialScore,setting:r.releaseVersion+'; '+r.reasoning,date:d.leaderboard.updatedAt,cost:r.costPerTaskUsd,tokens:r.outputTokensPerTask,metrics:{...Object.fromEntries(d.leaderboard.results.filter((s:any)=>s.model===r.model&&s.reasoning===r.reasoning&&s.releaseVersion===r.releaseVersion&&s.datasetScope!=='all'&&Number.isFinite(s.partialScore)).map((s:any)=>[s.datasetScope,s.partialScore])),binaryAccuracy:r.binaryAccuracy,taskCount:r.taskCount,usageTaskCount:r.usageTaskCount,cost:r.costPerTaskUsd,outputTokens:r.outputTokensPerTask}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
