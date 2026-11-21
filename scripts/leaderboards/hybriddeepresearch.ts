// HybridDeepResearch evaluates research agents that combine SQL and web search. The leaderboard JSON supplies its default average and three task-family scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/Snowflake-AI-Research/hybrid_leaderboard/main/data/results.json";
interface Entry { baseModel: string; system: string; org: string; date: string; scores: Record<string, Record<string, Record<string, Record<string, number>>>> }

const board: Leaderboard = {
  benchmark: "hybriddeepresearch",
  url: "https://snowflake-ai-research.github.io/hybrid_leaderboard/",
  feed: FEED,
  terms: "Check the publisher’s terms and upstream data licenses at https://snowflake-ai-research.github.io/hybrid_leaderboard/ The robots URL returns HTML.",
  parts: { s2sql: 'Search to SQL', sql2s: 'SQL to search', parallel: 'Parallel' },
  stats: { passAtK: { name: 'Pass@k', unit: '%', better: 'higher' } },
  async fetch() {
    const data = await fetchJson<{ boards: { main: { defaultSplit: string; defaultAgg: string; defaultK: number; primaryMetric: string } }; entries: Entry[] }>(FEED);
    const { defaultSplit, defaultAgg, defaultK, primaryMetric } = data.boards.main;
    if (data.entries.length < 12 || primaryMetric !== 'overall') throw new Error('Changed HybridDeepResearch leaderboard');
    return data.entries.map(r => {
      const scores = r.scores[defaultSplit]?.[defaultAgg]?.[defaultK];
      if (!r.baseModel || !r.system || !['overall','s2sql','sql2s','parallel'].every(k => Number.isFinite(scores?.[k]))) throw new Error('Missing default scores');
      const { overall, ...metrics } = scores;
      const pass = r.scores[defaultSplit]?.pass?.[defaultK]?.overall;
      if (Number.isFinite(pass)) metrics.passAtK = pass;
      return { model: r.baseModel, harness: r.system, agentOrg: r.org, score: overall, trials: defaultK, date: r.date, metrics };
    });
  },
};
export default board;
