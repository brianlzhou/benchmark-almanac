// AgentSettlementBench tests whether agents safely handle irreversible blockchain payments.
// The headline is full raw-model accuracy in the public leaderboard snapshot.
// The repository README publishes five named model rows and two failure metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/nagu-io/agent-settlement-bench/main/README.md';
const board: Leaderboard = {
  benchmark: 'agent-settlement-bench', url: 'https://github.com/nagu-io/agent-settlement-bench', feed: FEED,
  terms: 'The repository is public under its stated license. Source attribution applies.',
  stats: {
    criticalFailRate: { name: 'Critical failure rate', unit: '%', better: 'lower' },
    riskWeightedFail: { name: 'Risk-weighted failure rate', unit: '%', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED); const sec = text.split('## Result Snapshot')[1]?.split('## Mental Model')[0]; if (!sec) throw new Error('AgentSettlementBench table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of sec.split(/\r?\n/)) { const c=line.split('|').map(x=>x.trim()).filter(Boolean); if(c.length!==4||c[0]==='Model'||c[0].startsWith('-')) continue; const n=c.slice(1).map(x=>Number(x.replace('%',''))); if(n.some(x=>!Number.isFinite(x))) continue; rows.push({model:c[0],score:n[0],metrics:{criticalFailRate:n[1],riskWeightedFail:n[2]}}); }
    if(rows.length!==5) throw new Error(`Expected five rows, got ${rows.length}`); return rows;
  },
};
export default board;
