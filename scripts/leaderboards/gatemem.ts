// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// GateMem measures whether an agent can use shared memories while respecting access and deletion rules.
// The leaderboard JSON gives Memory Governance Score (MGS) and its three components for each domain.
import type { BoardStat, Leaderboard, LeaderboardRow} from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://rzhub.github.io/GateMem/assets/leaderboard.json';
const domains = ['Medical','Office','Education','Household'];
const gateStats: Record<string, BoardStat> = Object.fromEntries(domains.flatMap(domain => [
  [domain + ' Utility', { name: domain + ' utility', unit: '%', better: 'higher' }],
  [domain + ' Access violation rate', { name: domain + ' access violation rate', unit: '%', better: 'lower' }],
  [domain + ' Forgetting violation rate', { name: domain + ' forgetting violation rate', unit: '%', better: 'lower' as const }],
]));
type Entry = {backbone:string,method:string,domain:string,mgs:number,u:number,a:number,f:number,verified:boolean};
const board: Leaderboard = {
  benchmark:'gatemem', url:'https://rzhub.github.io/GateMem/', feed,
  terms:'The GateMem authors release the repository under MIT. https://github.com/rzhub/GateMem/blob/main/LICENSE',
  headline:'The leaderboard gives a Memory Governance Score for each domain, so the headline is their four-domain mean on the published 0 to 100 scale.',
  parts:Object.fromEntries(domains.map(d=>[d,d])), verified:'All four domain results are verified by the maintainers.',
  stats: gateStats,
  async fetch() {
    const groups = new Map<string,Map<string,Entry>>();
    for (const entry of await fetchJson<Entry[]>(feed)) {
      if (!entry.backbone || !entry.method || !domains.includes(entry.domain) ||
          ![entry.mgs,entry.u,entry.a,entry.f].every(v=>Number.isFinite(v) && v>=0 && v<=100))
        throw new Error('Invalid GateMem domain result');
      const key = JSON.stringify([entry.backbone,entry.method]);
      const group = groups.get(key) ?? new Map<string,Entry>();
      if (group.has(entry.domain)) throw new Error('Duplicate GateMem domain for '+key);
      group.set(entry.domain,entry); groups.set(key,group);
    }
    const rows: LeaderboardRow[] = [];
    for (const group of groups.values()) {
      if (group.size !== domains.length) continue;
      const entries = [...group.values()], first = entries[0];
      const metrics: Record<string,number> = {};
      for (const {domain,mgs,u,a,f} of entries) {
        metrics[domain]=mgs; metrics[domain+' Utility']=u;
        metrics[domain+' Access violation rate']=a; metrics[domain+' Forgetting violation rate']=f;
      }
      rows.push({model:first.backbone,harness:first.method,score:entries.reduce((sum,e)=>sum+e.mgs,0)/domains.length,
        verified:entries.every(e=>e.verified),metrics});
    }
    return checked(rows,42);
  },
};
export default board;
