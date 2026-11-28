// OSWorld-Science: the latest release, all-domain partial score is the headline percentage.
// Domain scores are metrics; reasoning is the configuration. Costs and output tokens are per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://discoailab.github.io/osworld-science-page/static/js/osciData.js";
const board: Leaderboard = {
 benchmark: "osworld-science",
 parts: {
   med: { name: 'Medical imaging', group: 'Domain' },
   bio: { name: 'Biology', group: 'Domain', note: 'The eight PyMOL and MNOVA tasks, excluding the separately scored EEGLAB tasks.' },
   eeg: { name: 'EEGLAB', group: 'Domain', note: 'The ten EEG analysis tasks in EEGLAB.' },
   chem: { name: 'Chemistry', group: 'Domain' },
   stat: { name: 'Statistics', group: 'Domain' },
   geo: { name: 'Geoscience', group: 'Domain' },
   ling: { name: 'Linguistics', group: 'Domain' },
   phys: { name: 'Physics', group: 'Domain' },
 },
 url: "https://discoailab.github.io/osworld-science-page/static/js/osciData.js",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 stats: {
   binaryAccuracy: { name: 'Binary accuracy', unit: '%', better: 'higher' },
 },
 chart:{title:'Partial score versus task cost',x:{key:'cost',label:'Cost per task',unit:'$',better:'lower'},y:{key:'score',label:'Partial score',unit:'%',better:'higher'}},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const d=jsonAfter<any>(await fetchText(FEED),'window.OSCI =');const latest=[...new Set(d.leaderboard.results.map((r:any)=>r.releaseVersion))].sort().at(-1);return d.leaderboard.results.filter((r:any)=>r.releaseVersion===latest&&r.datasetScope==='all'&&Number.isFinite(r.partialScore)).map((r:any)=>({model:r.model,score:r.partialScore,setting:r.releaseVersion+', '+r.reasoning,date:d.leaderboard.updatedAt,cost:r.costPerTaskUsd,tokens:r.outputTokensPerTask,metrics:{...Object.fromEntries(d.leaderboard.results.filter((s:any)=>s.model===r.model&&s.reasoning===r.reasoning&&s.releaseVersion===r.releaseVersion&&s.datasetScope!=='all'&&Number.isFinite(s.partialScore)).map((s:any)=>[s.datasetScope,s.partialScore])),binaryAccuracy:r.binaryAccuracy}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
