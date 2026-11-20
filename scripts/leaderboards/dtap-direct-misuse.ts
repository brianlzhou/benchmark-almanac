// DecodingTrust Agent direct misuse: use each model/framework entry’s published overall ASR percentage.
// Domain scores are metrics, not competing headline rows. Frameworks remain harnesses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://decodingtrust-agent.com/traj-api/benchmark";
const board: Leaderboard = {
 benchmark: "dtap-direct-misuse",
 parts: {
   workflow: { name: 'Workflow', group: 'Environment' },
   crm: { name: 'CRM', group: 'Environment' },
   'customer-service': { name: 'Customer service', group: 'Environment' },
   travel: { name: 'Travel', group: 'Environment' },
   coding: { name: 'Coding', group: 'Environment' },
   browser: { name: 'Browser', group: 'Environment' },
   research: { name: 'Research', group: 'Environment' },
   'os-filesystem': { name: 'OS filesystem', group: 'Environment' },
   windows: { name: 'Windows', group: 'Environment' },
   macos: { name: 'macOS', group: 'Environment' },
   finance: { name: 'Finance', group: 'Environment' },
   legal: { name: 'Legal', group: 'Environment' },
   telecom: { name: 'Telecom', group: 'Environment' },
   medical: { name: 'Medical', group: 'Environment' },
 },
 url: "https://decodingtrust-agent.com/leaderboard",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const d = await fetchJson<{entries: {metricType:string;modelName:string;overall:number;frameworkName:string;domainScores:Record<string,number>}[]}>(FEED);
return d.entries.filter(r => r.metricType === 'direct_asr' && Number.isFinite(r.overall))
  .map(r => ({model:r.modelName, score:r.overall, harness:r.frameworkName, metrics:r.domainScores}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
