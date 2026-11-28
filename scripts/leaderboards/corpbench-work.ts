// CorpBench Work v1.3: official composite score, with mean USD cost per task.
// Keep median token counts separate from means, with scored runs, local model sizes and capability measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://raw.githubusercontent.com/RevensiAI/CorpBench/main/results/work/1.3/report.json";
const board: Leaderboard = {
  "benchmark": "corpbench-work",
  "url": "https://huggingface.co/datasets/revensi/CorpBench",
  "feed": "https://raw.githubusercontent.com/RevensiAI/CorpBench/main/results/work/1.3/report.json",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  aliases: { 'mistral-small-2603': 'mistral-small-4' },
  chart: { title: 'Performance versus cost', x: { key: 'cost', label: 'Mean cost per task', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: 'CorpBench Score', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {

    const data = await fetchJson<any>(FEED);
    if (data.suiteId !== 'corpbench-work' || !Array.isArray(data.models)) throw new Error('Report schema changed');
    return data.models.filter((m: any) => Number.isFinite(m.corpBenchScore)).map((m: any) => {
      const metrics: Record<string, number> = {};
      if (Number.isFinite(m.costPerTask)) metrics.cost = m.costPerTask;
      for (const key of ['outcomeScore', 'efficiencyScore', 'passRate', 'medianLatencySeconds', 'medianOutputTokens', 'medianInputTokens', 'avgDurationSeconds', 'providerFailureRate', 'scoredRuns']) {
        if (Number.isFinite(m[key])) metrics[key] = m[key];
      }
      for (const [department, values] of Object.entries(m.departmentScores ?? {})) {
        for (const [key, value] of Object.entries(values as object)) if (typeof value === 'number') metrics[`${department}_${key}`] = value;
      }
      for(const key of ['allVariantsPassRate','costPerSuccessfulWorkflow','medianCachedInputTokens','totalToolCalls',
        'scheduledRuns','passedRuns','successfulTasks','providerFailures']) if(Number.isFinite(m[key])) metrics[key]=m[key];
      if(Number.isFinite(m.avgDurationSeconds)) metrics.latency=m.avgDurationSeconds;
      if(Number.isFinite(m.localSpecs?.minRamGb)) metrics.minRamGb=m.localSpecs.minRamGb;
      for(const [name,value] of Object.entries({...m.safety,...m.failureRates})) {
        if(typeof value==='number') metrics[name.replace(/-(.)/g,(_,c:string)=>c.toUpperCase())]=value;
      }
      for(const cap of data.capabilityScores ?? []) {
        if(cap.modelId!==m.modelId) continue;
        const dimension=cap.dimension.replace(/-(.)/g,(_:string,c:string)=>c.toUpperCase());
        for(const [field,suffix] of [['averageScore','Score'],['runs','Runs'],['scoredRuns','ScoredRuns'],
          ['passRate','PassRate'],['totalCostUsd','Cost']]) {
          if(Number.isFinite(cap[field])) metrics[dimension+suffix]=cap[field];
        }
      }
      const setting = [data.title, m.localSpecs?.quantization, m.localSpecs?.contextLength && `context ${m.localSpecs.contextLength}`].filter(Boolean).join('; ');
      return { model: identity(m.modelId.replace(/^[^/]+\//, '')), score: m.corpBenchScore, trials:m.scoredRuns, params:m.localSpecs?.parametersB, setting, harness: m.localSpecs?.runtime ?? 'CorpBench', cost: m.costPerTask, metrics };
    });
  },
};
board.parts = {
  outcomeScore: { name: 'Outcome', group: 'Dimension', note: 'Raw 0 to 1 outcome score contributes 60% of the composite.', unit: 'score' },
  efficiencyScore: { name: 'Efficiency', group: 'Dimension', note: 'Normalized efficiency against fixed baselines contributes 15% of the composite.', unit: 'score' },
};
board.stats = {
  passRate: { name: 'Pass rate', unit: 'score', better: 'higher', note: 'Fraction of scheduled workflows that passed, from 0 to 1.' },
  medianLatencySeconds: { name: 'Median latency', unit: 'seconds', better: 'lower' },
  medianOutputTokens: { name: 'Median output tokens', unit: 'tokens' },
  medianInputTokens: { name: 'Median input tokens', unit: 'tokens' },
  avgDurationSeconds: { name: 'Average duration', unit: 'seconds', better: 'lower' },
  providerFailureRate: { name: 'Provider failure rate', unit: 'score', better: 'lower', note: 'Fraction of runs with provider failures, from 0 to 1.' },
  providerFailures: { name: 'Provider failures', unit: 'count', better: 'lower' },
  scoredRuns: { name: 'Scored runs', unit: 'count' },
  allVariantsPassRate: { name: 'All variants pass rate', unit: 'score', better: 'higher', note: 'Fraction of workflow variants that passed, from 0 to 1.' },
  costPerSuccessfulWorkflow: { name: 'Cost per successful workflow', unit: 'usd', better: 'lower' },
  medianCachedInputTokens: { name: 'Median cached input tokens', unit: 'tokens' },
  totalToolCalls: { name: 'Total tool calls', unit: 'count' },
  scheduledRuns: { name: 'Scheduled runs', unit: 'count' },
  passedRuns: { name: 'Passed runs', unit: 'count' },
  successfulTasks: { name: 'Successful tasks', unit: 'count' },
  latency: { name: 'Average latency', unit: 'seconds', better: 'lower' },
  collateralChanges: { name: 'Collateral changes', unit: 'count', better: 'lower' },
  missedEscalations: { name: 'Missed escalations', unit: 'count', better: 'lower' },
  unnecessaryEscalations: { name: 'Unnecessary escalations', unit: 'count', better: 'lower' },
  prematureFinalization: { name: 'Premature finalization rate', unit: 'score', better: 'lower' },
  requiredCallOmitted: { name: 'Required call omission rate', unit: 'score', better: 'lower' },
  requiredCallMisordered: { name: 'Required call misordering rate', unit: 'score', better: 'lower' },
  retryAbandoned: { name: 'Abandoned retry rate', unit: 'score', better: 'lower' },
  requiredWriteMissing: { name: 'Required write omission rate', unit: 'score', better: 'lower' },
  wrongHumanHandoff: { name: 'Wrong human handoff rate', unit: 'score', better: 'lower' },
  minRamGb: { name: 'Minimum RAM', unit: 'gb' },
};
const fractionStat = (name: string, better: 'higher' | 'lower' = 'higher') => ({ name, unit: 'score', better, note: 'Stored as a fraction from 0 to 1.' } as const);
for (const [key, name] of [['marketing', 'Marketing'], ['sales', 'Sales'], ['revops', 'RevOps'], ['operations', 'Operations'], ['finance', 'Finance']]) {
  board.stats[`${key}_outcome`] = fractionStat(`${name} outcome score`);
  board.stats[`${key}_passRate`] = fractionStat(`${name} pass rate`);
  board.stats[`${key}_scoredRuns`] = { name: `${name} scored runs`, unit: 'count' };
}
const capabilityNames: Record<string, string> = {
  multiSystemReconciliation: 'Multi-system reconciliation', toolDataflow: 'Tool dataflow', optimisticConcurrency: 'Optimistic concurrency', transientRecovery: 'Transient recovery', approvalHandoff: 'Approval handoff', safeWrites: 'Safe writes', multiSystemReasoning: 'Multi-system reasoning', exactToolDataflow: 'Exact tool dataflow', policyRetrieval: 'Policy retrieval', unnecessaryEscalationAvoidance: 'Unnecessary escalation avoidance', freshnessWindow: 'Freshness window', stripeEvidence: 'Stripe evidence', salesforceEvidence: 'Salesforce evidence', safeEscalation: 'Safe escalation', entityConsistency: 'Entity consistency', docusignEvidence: 'DocuSign evidence', hubspotEvidence: 'HubSpot evidence', approvalThreshold: 'Approval threshold', varianceThreshold: 'Variance threshold', apolloEvidence: 'Apollo evidence', sourceAgreement: 'Source agreement', crossSystemValidation: 'Cross-system validation', promptInjectionResistance: 'Prompt injection resistance', analytics: 'Analytics', contentControls: 'Content controls', riskHandoff: 'Risk handoff', ga4Evidence: 'GA4 evidence', contentfulEvidence: 'Contentful evidence', inventoryReasoning: 'Inventory reasoning', idempotency: 'Idempotency', multiSystemFulfillment: 'Multi-system fulfillment', exceptionHandling: 'Exception handling', versionedWrites: 'Versioned writes', safePartialAction: 'Safe partial action', netsuiteEvidence: 'NetSuite evidence', shipbobEvidence: 'ShipBob evidence', identityResolution: 'Identity resolution', safeMerge: 'Safe merge', crossSystemRouting: 'Cross-system routing', enrichment: 'Enrichment', policyPrecedence: 'Policy precedence', humanEscalation: 'Human escalation', shopifyEvidence: 'Shopify evidence', dealDesk: 'Deal desk', approvalBoundaries: 'Approval boundaries', toolSelection: 'Tool selection', accountHierarchy: 'Account hierarchy', forbiddenActionAvoidance: 'Forbidden action avoidance',
};
for (const [key, name] of Object.entries(capabilityNames)) {
  board.stats[`${key}Score`] = fractionStat(`${name} score`);
  board.stats[`${key}Runs`] = { name: `${name} runs`, unit: 'count' };
  board.stats[`${key}ScoredRuns`] = { name: `${name} scored runs`, unit: 'count' };
  board.stats[`${key}PassRate`] = fractionStat(`${name} pass rate`);
  board.stats[`${key}Cost`] = { name: `${name} cost`, unit: 'usd', better: 'lower' };
}
export default board;
