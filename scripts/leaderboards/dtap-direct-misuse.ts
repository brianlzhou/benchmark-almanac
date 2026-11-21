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
   priceExploitation: { name: 'Price exploitation', group: 'Category' },
   highCostTest: { name: 'High-cost test', group: 'Category' },
   highCostBilling: { name: 'High-cost billing', group: 'Category' },
 },
 stats: { scoredDomains: { name: 'Scored domains', unit: 'count' } },
 url: "https://decodingtrust-agent.com/leaderboard",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const d = await fetchJson<{entries: {metricType:string;modelName:string;overall:number;frameworkName:string;domainScores:Record<string,number>;scoredDomains:number;modelKey:string;frameworkKey:string}[];
  categoryTables:{domainKey:string;metricType:string;categories:{key:string;label:string}[];entries:{modelKey:string;frameworkKey:string;categoryScores:Record<string,number>}[]}[]}>(FEED);
return d.entries.filter(r => r.metricType === 'direct_asr' && Number.isFinite(r.overall))
  .map(r => {
    const metrics = {...r.domainScores, scoredDomains: r.scoredDomains};
    const categories: Record<string,string> = {'high-cost-billing':'highCostBilling','high-cost-test':'highCostTest','price-exploitation':'priceExploitation'};
    for (const table of d.categoryTables) {
      if (table.metricType !== r.metricType || !['medical','travel'].includes(table.domainKey)) continue;
      const entry = table.entries.find(e => e.modelKey === r.modelKey && e.frameworkKey === r.frameworkKey);
      for (const {key,label} of table.categories) {
        const value = entry?.categoryScores[key];
        if (categories[key] && Number.isFinite(value)) {
          (metrics as Record<string, number>)[categories[key]] = value!;
          board.parts![categories[key]] = {name:label,group:table.domainKey};
        }
      }
    }
    return {model:r.modelName, score:r.overall, harness:r.frameworkName, metrics};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
