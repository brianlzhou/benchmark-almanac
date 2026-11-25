// AGI-Pilled Bench asks models when AI milestones will happen, even though they happened in 2026.
// The headline score is the median forecast in years after 2026, so lower means a more AGI-pilled forecast.
// This importer reads the site's public data.json file, which contains one row per model setting and harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://agi-pilled-bench.adamholter.chatgpt.site/data.json';
interface Model {
  name: string;
  effort?: string;
  harness?: string;
  score?: number;
  ci?: [number, number];
  n_scored?: number;
  n?: number;
  never_rate?: number;
  done_rate?: number;
  ai_alone_rate?: number;
  cost?: number;
  tokens?: number;
}
interface Data { models?: Model[] }

const board: Leaderboard = {
  benchmark: 'agi-pilled-bench',
  harnesses: 'system',
  reference: ['OpenRouter API'],
  url: 'https://agi-pilled-bench.adamholter.chatgpt.site/',
  feed: FEED,
  terms: 'The site publishes data.json and states no separate reuse license. Results are credited to Adam Holter with a link to the source.',
  stats: { neverRate: { name: 'Never happened rate', unit: '%', better: 'lower' }, scored: { name: 'Scored responses', unit: 'count' }, responses: { name: 'Responses', unit: 'count' } },
  parts: {
    doneRate: { name: 'Done forecast rate', group: 'Forecast details', note: 'Share of forecasts that say a milestone already happened.' },
    aiAloneRate: { name: 'AI alone rate', group: 'Forecast details', note: 'Share of forecasts that say AI achieved the milestone without human help.' },
  },
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    if (!Array.isArray(data.models) || data.models.length < 17) throw new Error('AGI-Pilled Bench: models array is missing or too short');
    const rows: LeaderboardRow[] = [];
    for (const m of data.models) {
      if (!m.name || typeof m.score !== 'number' || !Number.isFinite(m.score)) continue;
      const metrics: Record<string, number> = {};
      if (typeof m.never_rate === 'number') metrics.neverRate = m.never_rate * 100;
      if (typeof m.done_rate === 'number') metrics.doneRate = m.done_rate * 100;
      if (typeof m.ai_alone_rate === 'number') metrics.aiAloneRate = m.ai_alone_rate * 100;
      if (typeof m.n_scored === 'number') metrics.scored = m.n_scored;
      if (typeof m.n === 'number') metrics.responses = m.n;
      rows.push({
        model: m.name,
        score: m.score,
        setting: m.effort,
        harness: m.harness,
        low: m.ci?.[0],
        high: m.ci?.[1],
        cost: m.cost,
        tokens: m.tokens,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (rows.length < 17) throw new Error(`AGI-Pilled Bench: ${rows.length} readable models, expected at least 17`);
    return rows;
  },
};
export default board;
