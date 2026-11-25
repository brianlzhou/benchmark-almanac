// LiveMACE measures persistent trading agents across 30 days of simulated trading in live markets.
// Table 7 reports the whole-period cumulative return for every completed configuration.
// The capability-specific tables describe tool use, memory, rule following and multi-agent collaboration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const url = 'https://arxiv.org/html/2610.09872';
const models: Record<string, string> = { DeepSeek: 'DeepSeek-V3.2', Grok: 'Grok-4.20', Gemini: 'Gemini-3.1-Pro', Qwen: 'Qwen3-Max', 'GPT-5.4': 'GPT-5.4' };
const board: Leaderboard = {
  benchmark: 'livemace', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  headline: 'The headline is cumulative portfolio return (%) over the full evaluation period for each agent configuration.',
  stats: {
    callsPerStep: { name: 'Tool calls per step', unit: 'count' },
    validCallRate: { name: 'Valid call rate', unit: 'score', better: 'higher' },
    routingQuality: { name: 'Routing quality', unit: 'score', better: 'higher' },
    avgTokens: { name: 'Average tokens', unit: 'tokens', better: 'lower' },
    toolCallScore: { name: 'Tool call score', unit: 'score', better: 'higher' },
    hallucinationFree: { name: 'Hallucination-free rate', unit: 'score', better: 'higher' },
    judgeMean: { name: 'Judge mean score', unit: 'score', better: 'higher' },
    relevance: { name: 'Tool relevance', unit: 'score', better: 'higher' },
    efficiency: { name: 'Information efficiency', unit: 'score', better: 'higher' },
    coverage: { name: 'Information coverage', unit: 'score', better: 'higher' },
    faithfulness: { name: 'Evidence faithfulness', unit: 'score', better: 'higher' },
    drawdownPct: { name: 'Maximum drawdown', unit: '%', better: 'lower' },
    hardRulePass: { name: 'Hard rule pass rate', unit: 'score', better: 'higher' },
    ruleSatisfaction: { name: 'Rule satisfaction score', unit: 'score', better: 'higher' },
    ruleAuditability: { name: 'Rule auditability score', unit: 'score', better: 'higher' },
    traces: { name: 'Collaboration traces', unit: 'count' },
    collaboration: { name: 'Reported overall collaboration score', unit: 'score', better: 'higher' },
    alternativeCollaboration: { name: 'Alternative collaboration score', unit: 'score', better: 'higher' },
    sharpLosses: { name: 'Sharp losses', unit: 'count', better: 'lower' },
    sharpGains: { name: 'Sharp gains', unit: 'count', better: 'higher' },
    maxLossStreak: { name: 'Maximum loss streak', unit: 'count', better: 'lower' },
    tailLossPct: { name: 'Tail loss', unit: '%', better: 'higher' },
  },
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(url));
    const table = tables.find(t => t[0].join('|') === 'Backbone|Base (%)|Tool (%)|Memory (%)|Rule (%)|Multi-Agent (%)');
    if (!table) throw new Error('Missing full-period returns');
    function diagnostics(header: string, model: string) {
      const row = tables.find(t => t[0].join('|') === header)?.find(r => r[0] === model);
      if (!row) throw new Error('Missing ' + header + ' for ' + model);
      return row.slice(1);
    }
    const rows: LeaderboardRow[] = [];
    for (const [label, ...returns] of table.slice(1)) {
      const model = models[label];
      if (!model || returns.length !== 5) throw new Error('Unknown backbone or missing configuration');
      for (const [i, value] of returns.entries()) {
        if (value === '–') continue;
        const harness = table[0][i + 1].replace(' (%)', '');
        const metrics: Record<string, number> = {};
        if (harness === 'Tool') {
          const [calls, valid, routing, tokens, tcs, hfr] = diagnostics('Model|Calls/step|VCR|RQ|Avg. tokens|TCS|HFR', model);
          const [judge, relevance, efficiency, coverage, faithfulness] = diagnostics('Model|Judge mean|TR|IE|IC|EF', model);
          if (!tokens.endsWith('k')) throw new Error('Unknown token unit');
          Object.assign(metrics, { callsPerStep: numberCell(calls), validCallRate: numberCell(valid), routingQuality: numberCell(routing),
            avgTokens: numberCell(tokens.slice(0, -1)) * 1000, toolCallScore: numberCell(tcs), hallucinationFree: numberCell(hfr),
            judgeMean: numberCell(judge), relevance: numberCell(relevance), efficiency: numberCell(efficiency),
            coverage: numberCell(coverage), faithfulness: numberCell(faithfulness) });
        } else if (harness === 'Rule') {
          const [, mdd, hpr, rss, ras] = diagnostics('Model|Final Return (%) \\uparrow|MDD (%) \\downarrow|HPR \\uparrow|RSS \\uparrow|RAS \\uparrow', model);
          Object.assign(metrics, { drawdownPct: numberCell(mdd.replace('%', '')), hardRulePass: numberCell(hpr), ruleSatisfaction: numberCell(rss), ruleAuditability: numberCell(ras) });
        } else if (harness === 'Multi-Agent') {
          const [traces, reported, alternative, interval] = diagnostics('Model|Traces|Reported OCS|Alternative OCS|95% CI', model);
          const range = interval.match(/^\[([\d.]+), ([\d.]+)\]$/);
          if (!range) throw new Error('Missing collaboration interval');
          Object.assign(metrics, { traces: numberCell(traces), collaboration: numberCell(reported), alternativeCollaboration: numberCell(alternative),
            collaborationLow: numberCell(range[1]), collaborationHigh: numberCell(range[2]) });
        } else {
          const memory = tables.find(t => t[0].join('|') === 'Model|Memory|Final Return|MDD|Sharp Losses|Sharp Gains|Max Loss Streak|TL');
          const idx = memory?.findIndex(r => r[0] === model) ?? -1;
          const row = idx > 0 ? memory?.[idx + (harness === 'Base' ? 1 : 0)] : undefined;
          if (!row || row[1] !== (harness === 'Base' ? 'w/o Mem' : 'w/ Mem')) throw new Error('Missing matched memory account');
          Object.assign(metrics, { drawdownPct: numberCell(row[3].replace('%', '')), sharpLosses: numberCell(row[4]),
            sharpGains: numberCell(row[5]), maxLossStreak: numberCell(row[6]), tailLossPct: numberCell(row[7].replace('%', '')) });
        }
        rows.push({ model, harness, score: numberCell(value), metrics });
      }
    }
    return checked(rows, 23);
  },
};
export default board;
