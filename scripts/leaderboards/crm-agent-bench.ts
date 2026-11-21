// CRM-Agent-Bench ranks enterprise agents by strict success in the official first round.
// The pass^3 measure counts tasks that succeed in all three rounds.
// The project’s results script also contains repeated runs, domain breakdowns and first-round resource use.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const url = "https://crm-agent-bench.github.io/#results";
const feed = "https://crm-agent-bench.github.io/data/results.js";

const board: Leaderboard = {
  benchmark: 'crm-agent-bench', url, feed,
  stats: {
    latency: { name: 'First round latency', unit: 'seconds', better: 'lower' },
    mean: { name: 'Mean success rate', unit: '%', better: 'higher' },
    pass3: { name: 'Three-round pass rate', unit: '%', better: 'higher' },
    totalTokensPerTask: { name: 'First round tokens per task', unit: 'tokens' },
    toolCalls: { name: 'First round tool calls', unit: 'count' },
    round1: { name: 'Round 1 success rate', unit: '%', better: 'higher' },
    round2: { name: 'Round 2 success rate', unit: '%', better: 'higher' },
    round3: { name: 'Round 3 success rate', unit: '%', better: 'higher' },
    round2_customer_support: { name: 'Round 2 customer support rate', unit: '%', better: 'higher' },
    round2_field_service: { name: 'Round 2 field service rate', unit: '%', better: 'higher' },
    round2_itsm: { name: 'Round 2 information technology service management rate', unit: '%', better: 'higher' },
    round2_marketing: { name: 'Round 2 marketing rate', unit: '%', better: 'higher' },
    round2_onboarding: { name: 'Round 2 onboarding rate', unit: '%', better: 'higher' },
    round2_payments: { name: 'Round 2 payments rate', unit: '%', better: 'higher' },
    round2_retail: { name: 'Round 2 retail rate', unit: '%', better: 'higher' },
    round2_sales: { name: 'Round 2 sales rate', unit: '%', better: 'higher' },
    round2_travel: { name: 'Round 2 travel rate', unit: '%', better: 'higher' },
    round3_customer_support: { name: 'Round 3 customer support rate', unit: '%', better: 'higher' },
    round3_field_service: { name: 'Round 3 field service rate', unit: '%', better: 'higher' },
    round3_itsm: { name: 'Round 3 information technology service management rate', unit: '%', better: 'higher' },
    round3_marketing: { name: 'Round 3 marketing rate', unit: '%', better: 'higher' },
    round3_onboarding: { name: 'Round 3 onboarding rate', unit: '%', better: 'higher' },
    round3_payments: { name: 'Round 3 payments rate', unit: '%', better: 'higher' },
    round3_retail: { name: 'Round 3 retail rate', unit: '%', better: 'higher' },
    round3_sales: { name: 'Round 3 sales rate', unit: '%', better: 'higher' },
    round3_travel: { name: 'Round 3 travel rate', unit: '%', better: 'higher' },
  },
  terms: "The repository specifies Apache 2.0. The site does not give separate leaderboard terms. https://github.com/salesforce-misc/crm-agent-bench" ,
  aliases: { 'Inkling Small NVFP4': 'inkling-small', 'Nemotron Super 3 120B': 'nemotron-3-super',
    'Nemotron 3.5 Lightning 30B': 'nemotron-3-5-lightning-30b-a3b' },
  costPer: 'run',
  async fetch() {
    type Model = {name: string; rounds: {round: number; rate: number}[]; meanRate: number; sampleSdPp: number; pass3: {rate: number};
      firstRound: {costUsd: number | null; latencySeconds: number; tokens: number; toolCalls: number};
      roundDomainRates: {round: number; rates: Record<string,number>}[] };
    const data = jsonAfter<{benchmark: {systems: number; domains: {id:string;name:string}[]}; models: Model[]}>(await fetchText(feed),'window.CRM_BENCH_DATA =');
    const {domains, systems} = data.benchmark;
    if (data.models.length !== systems || systems < 16 || domains.length < 9) throw new Error('Incomplete CRM board');
    board.parts = Object.fromEntries(domains.map(d => [d.id,d.name]));
    return data.models.map(m => {
      const run = m.firstRound;
      const metrics: Record<string,number> = {mean: 100*m.meanRate, std: m.sampleSdPp, pass3: 100*m.pass3.rate,
        latency: run.latencySeconds, totalTokens: run.tokens, toolCalls: run.toolCalls};
      for (const round of [1,2,3]) {
        const score = m.rounds.find(r => r.round === round)?.rate;
        const splits = m.roundDomainRates.find(r => r.round === round)?.rates;
        if (score == null || !splits) throw new Error('Missing round ' + round);
        metrics['round' + round] = 100*score;
        for (const d of domains) metrics[round === 1 ? d.id : 'round' + round + '_' + d.id] = 100*splits[d.id];
      }
      if (!m.name || !Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete CRM result');
      return {model: m.name, score: metrics.round1, cost: run.costUsd ?? undefined, metrics};
    });
  },
};
export default board;
