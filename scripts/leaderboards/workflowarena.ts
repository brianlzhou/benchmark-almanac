// WorkflowArena measures executable workflow orchestration across 145 tasks in eight professional domains.
// The default ranking is Overall Resolved, the equal-weight mean of the eight domain resolved rates.
// This importer reads the model, configuration, domain and score arrays from the official JavaScript feed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://lab.einsia.ai/workflowarena/home.html#leaderboard';
const FEED = 'https://lab.einsia.ai/workflowarena/home-data.js?v=20261110-paper-links-v4';

interface ModelInfo {
  name: string;
  harness: string;
}

interface DomainInfo {
  key: string;
  name: string;
}

type ScoreRow = [string, string, ...number[]];

const board: Leaderboard = {
  benchmark: 'workflowarena',
  url: PAGE,
  feed: FEED,
  terms: 'The project publishes source-specific licenses and attribution in NOTICE.md. robots.txt allows all paths. https://github.com/Einsia/WorkflowArena/blob/main/NOTICE.md',
  static: 'paper',
  harnesses: 'system',
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const normalized = source.replaceAll("'", '"');
    const modelsStart = normalized.indexOf('const models =');
    const domainsStart = normalized.indexOf('const domains =');
    const continuousStart = normalized.indexOf('const continuous =');
    const resolvedStart = normalized.indexOf('const resolved =');
    if ([modelsStart, domainsStart, continuousStart, resolvedStart].some((index) => index < 0)) throw new Error('WorkflowArena score arrays missing');
    const models = jsLiteral<Record<string, ModelInfo>>(normalized, normalized.indexOf('{', modelsStart));
    const domains = jsLiteral<DomainInfo[]>(normalized, normalized.indexOf('[', domainsStart));
    const continuous = jsLiteral<ScoreRow[]>(normalized, normalized.indexOf('[', continuousStart));
    const resolved = jsLiteral<ScoreRow[]>(normalized, normalized.indexOf('[', resolvedStart));
    if (Object.keys(models).length < 9 || domains.length !== 8 || continuous.length < 25 || resolved.length !== continuous.length) {
      throw new Error(`WorkflowArena: expected 9 models, 8 domains and 25 configurations, got ${Object.keys(models).length}, ${domains.length}, ${continuous.length}, ${resolved.length}`);
    }
    const resolvedByConfig = new Map(resolved.map((row) => [`${row[0]}|${row[1]}`, row]));
    if (resolvedByConfig.size !== resolved.length) throw new Error('WorkflowArena: duplicate resolved configurations');
    board.parts = {};
    for (const domain of domains) {
      board.parts[domain.key.toLowerCase()] = { name: domain.name, group: 'Resolved rate' };
      board.parts[`continuous${domain.key}`] = { name: domain.name, group: 'Continuous score', unit: 'score' };
    }

    // The resource-use paragraph gives per-task cost estimates for these three configurations.
    const costs: Record<string, number> = { 'sol|low': 3.61, 'opus|high': 6.66, 'astra|xhigh': 29.26 };
    const date = source.match(/return\s*\{\s*date:\s*['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
    if (!date) throw new Error('WorkflowArena: missing report date');
    const delegationStart = normalized.indexOf('delegation:');
    if (delegationStart < 0) throw new Error('WorkflowArena: missing high-effort delegation data');
    const delegationSource = normalized.slice(delegationStart).replace(/:\.(\d)/g, ':0.$1');
    const delegation = jsLiteral<{ model: string; calls: number; workers: number }[]>(delegationSource, delegationSource.indexOf('['));
    const seen = new Set<string>();
    return continuous.map((row) => {
      const [modelKey, effort, continuousScore, ...continuousDomains] = row;
      const key = `${modelKey}|${effort}`;
      if (seen.has(key)) throw new Error(`WorkflowArena: duplicate configuration ${key}`);
      seen.add(key);
      const resolvedRow = resolvedByConfig.get(key);
      const model = models[modelKey];
      if (!model || !resolvedRow || continuousDomains.length !== domains.length || resolvedRow.length !== domains.length + 3) throw new Error(`WorkflowArena: incomplete ${modelKey} ${effort} row`);
      if (![...row.slice(2), ...resolvedRow.slice(2)].every(Number.isFinite)) throw new Error(`WorkflowArena: invalid scores for ${key}`);
      const metrics: Record<string, number> = { continuousScore };
      const profile = effort === 'high' && delegation.find((entry) => entry.model === modelKey);
      if (profile) {
        metrics.workflowCalls = profile.calls;
        metrics.workersPerWorkflow = profile.workers;
      }
      domains.forEach((domain, index) => {
        metrics[domain.key.toLowerCase()] = Number(resolvedRow[index + 3]);
        metrics[`continuous${domain.key}`] = continuousDomains[index];
      });
      return {
        model: model.name,
        setting: effort,
        harness: model.harness,
        score: resolvedRow[2],
        metrics,
        cost: costs[key],
        trials: 1,
        date,
      };
    });
  },
};

export default board;
