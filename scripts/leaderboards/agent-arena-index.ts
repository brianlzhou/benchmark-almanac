// Arena's Agent Arena Index (launched 2026-11-18), read through Arena's Hugging Face dataset
// lmarena-ai/leaderboard-dataset: agent_capability (anchored 1000-centered composite index across overall,
// chat, code, and work categories), joined with sibling sub-indexes agent_task_outcome and agent_tool_efficiency
// plus median per-task cost and output tokens from the agent subset when the publish date matches.
// Each row preserves the score's 95% confidence interval (index_score_ci_lower, index_score_ci_upper) as
// low/high bounds and metrics.ciLow/ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaSubset, splitName } from './lmarena-elo.ts';

interface IndexRow {
  model_name: string;
  organization?: string | null;
  license?: string | null;
  index_score?: number | null;
  index_score_ci_lower?: number | null;
  index_score_ci_upper?: number | null;
  raw_score?: number | null;
  session_count?: number | null;
  category: string;
  leaderboard_publish_date?: string;
}

interface AgentCostRow {
  model_name: string;
  category: string;
  cost_per_task_p50?: number | null;
  output_tokens_per_task_p50?: number | null;
  leaderboard_publish_date?: string;
}

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const round2 = (x: number) => Math.round(x * 100) / 100;

const board: Leaderboard = {
  benchmark: 'agent-arena-index',
  url: 'https://arena.ai/leaderboard/agent',
  feed: arenaFeed('agent_capability', '*'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  parts: {
    chat: { name: 'Chat', group: 'Category' },
    code: { name: 'Coding', group: 'Category' },
    work: { name: 'Work', group: 'Category' },
    taskOutcome: { name: 'Task outcome', group: 'Sub-index' },
    taskOutcomeChat: { name: 'Task outcome: Chat', group: 'Sub-index' },
    taskOutcomeCode: { name: 'Task outcome: Coding', group: 'Sub-index' },
    taskOutcomeWork: { name: 'Task outcome: Work', group: 'Sub-index' },
    toolEfficiency: { name: 'Tool efficiency', group: 'Sub-index' },
    toolEfficiencyChat: { name: 'Tool efficiency: Chat', group: 'Sub-index' },
    toolEfficiencyCode: { name: 'Tool efficiency: Coding', group: 'Sub-index' },
    toolEfficiencyWork: { name: 'Tool efficiency: Work', group: 'Sub-index' },
  },
  stats: {
    sessions: { name: 'Sessions', unit: 'count' },
    toolEfficiencyRate: { name: 'Tool efficiency rate', unit: '%', better: 'higher' },
    costPerTaskMedianUsd: { name: 'Median cost per task', unit: 'usd', better: 'lower' },
    outputTokensPerTaskMedian: { name: 'Median output tokens per task', unit: 'tokens', better: 'lower' },
  },
  chart: {
    title: 'Agent Arena Index vs. median cost per task',
    x: { key: 'costPerTaskMedianUsd', label: 'Median cost per task', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Agent Arena Index', unit: 'index', better: 'higher' },
    note: 'Each cost is the median cost of one task in Agent Mode sessions, as Arena reports it.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const [cap, outcome, eff, agent] = await Promise.all([
      arenaSubset<IndexRow>('agent_capability'),
      arenaSubset<IndexRow>('agent_task_outcome'),
      arenaSubset<IndexRow>('agent_tool_efficiency'),
      arenaSubset<AgentCostRow>('agent').catch(() => [] as AgentCostRow[]),
    ]);

    const capByModel = new Map<string, Map<string, IndexRow>>();
    for (const r of cap) {
      if (!r.model_name || !fin(r.index_score)) continue;
      const name = r.model_name.trim();
      let byCat = capByModel.get(name);
      if (!byCat) capByModel.set(name, (byCat = new Map()));
      byCat.set(r.category, r);
    }

    const indexByModel = (rows: IndexRow[]) => {
      const m = new Map<string, Map<string, IndexRow>>();
      for (const r of rows) {
        if (!r.model_name || !fin(r.index_score)) continue;
        const name = r.model_name.trim();
        let byCat = m.get(name);
        if (!byCat) m.set(name, (byCat = new Map()));
        byCat.set(r.category, r);
      }
      return m;
    };
    const outByModel = indexByModel(outcome);
    const effByModel = indexByModel(eff);
    const costByModel = new Map(
      agent.filter((r) => r.category === 'overall' && r.model_name).map((r) => [r.model_name.trim(), r]),
    );

    const overall = cap.filter((r) => r.category === 'overall' && r.model_name && fin(r.index_score));
    if (!overall.length) throw new Error('Agent Arena Index: no overall rows in agent_capability');

    return overall.map((r): LeaderboardRow => {
      const name = r.model_name.trim();
      const pub = r.leaderboard_publish_date;
      const metrics: Record<string, number> = {};
      if (fin(r.index_score_ci_lower) && fin(r.index_score_ci_upper)) {
        metrics.ciLow = round2(r.index_score_ci_lower);
        metrics.ciHigh = round2(r.index_score_ci_upper);
      }
      if (fin(r.session_count)) metrics.sessions = r.session_count;

      const capCats = capByModel.get(name);
      for (const cat of ['chat', 'code', 'work'] as const) {
        const sub = capCats?.get(cat);
        if (sub && sub.leaderboard_publish_date === pub && fin(sub.index_score)) metrics[cat] = round2(sub.index_score);
      }

      const outCats = outByModel.get(name);
      for (const [cat, key] of [
        ['overall', 'taskOutcome'],
        ['chat', 'taskOutcomeChat'],
        ['code', 'taskOutcomeCode'],
        ['work', 'taskOutcomeWork'],
      ] as const) {
        const sub = outCats?.get(cat);
        if (sub && sub.leaderboard_publish_date === pub && fin(sub.index_score)) metrics[key] = round2(sub.index_score);
      }

      const effCats = effByModel.get(name);
      for (const [cat, key] of [
        ['overall', 'toolEfficiency'],
        ['chat', 'toolEfficiencyChat'],
        ['code', 'toolEfficiencyCode'],
        ['work', 'toolEfficiencyWork'],
      ] as const) {
        const sub = effCats?.get(cat);
        if (sub && sub.leaderboard_publish_date === pub && fin(sub.index_score)) metrics[key] = round2(sub.index_score);
      }
      const effOverall = effCats?.get('overall');
      if (effOverall && effOverall.leaderboard_publish_date === pub && fin(effOverall.raw_score)) {
        metrics.toolEfficiencyRate = round2(effOverall.raw_score * 100);
      }

      const ag = costByModel.get(name);
      if (ag && ag.leaderboard_publish_date === pub) {
        if (fin(ag.cost_per_task_p50)) metrics.costPerTaskMedianUsd = ag.cost_per_task_p50;
        if (fin(ag.output_tokens_per_task_p50)) metrics.outputTokensPerTaskMedian = ag.output_tokens_per_task_p50;
      }

      return {
        ...splitName(name, pub),
        score: round2(r.index_score!),
        ...(metrics.ciLow !== undefined && metrics.ciHigh !== undefined ? { low: metrics.ciLow, high: metrics.ciHigh } : {}),
        license: r.license?.trim() || undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      };
    });
  },
};
export default board;
