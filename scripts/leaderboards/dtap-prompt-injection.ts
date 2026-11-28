// DTap Prompt Injection is the indirect-injection subset. The official API publishes indirect_asr
// percentages per model/harness, with an overall score, domain breakdowns and a count of scored domains. Lower is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='https://decodingtrust-agent.com/traj-api/benchmark';
const board:Leaderboard={benchmark:'dtap-prompt-injection', parts: {
  workflow: { name: 'Workflow', group: 'Environment' },
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
  crm: { name: 'Customer relationship management', group: 'Environment' },
},url:'https://decodingtrust-agent.com/',feed:FEED,terms:'Public DecodingTrust-Agent benchmark API, subject to the project and website terms.',aliases:{'Opus-4.6':'claude-opus-4-6','Sonnet-4.5':'claude-sonnet-4-5'},async fetch(){
 const data=await fetchJson<{run:{slug:string};entries:Array<{metricType:string;modelName:string;frameworkName:string;overall:number;scoredDomains?:number;domainScores:Record<string,number>}>}>(FEED);
 const rows:LeaderboardRow[]=data.entries.filter(r=>r.metricType==='indirect_asr'&&Number.isFinite(r.overall)).map(r=>({model:r.modelName,harness:r.frameworkName,score:r.overall,setting:data.run.slug+', indirect injection',metrics:{...r.domainScores}}));
 if(!rows.length)throw new Error('No indirect injection results');return rows;
}};
export default board;
