// FrontierFinance on samaya.ai. The benchmark page is server-rendered with one leaderboard table: # |
// System | Reasoning effort (API default) | Score | Avg. latency | Avg. cost. Score (0 to 100) is the
// headline, the effort is the setting and Avg. cost (US dollars per question) the cost. Model rows read
// "◆ Claude Fable 5.1 · Finance Agent v2": the model, then the agent it ran in, kept as the harness.
// Samaya's own systems ("Samaya Sterling") are listed too and stay unmatched. Avg. latency (seconds per
// question) is metrics.latency, the x-axis of the page's latency chart. The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://samaya.ai/benchmarks/frontier-finance';

const board: Leaderboard = {
  benchmark: 'frontierfinance',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Server-rendered public page; robots.txt disallows only /api/ and a few internal paths, and the site terms (samaya.ai/terms) have no clause against reading it.',
  aliases: {
    'Muse Wonder 1.0': 'muse-wonder',
  },
  chart: {
    title: 'Score against latency per query',
    note: 'The page plots the overall rubrics qualification rate against the mean latency of one query, for the top systems in each harness.',
    x: { key: 'latency', label: 'Avg. latency', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const rows = await tableRows(URL, {
      model: /^System$/i,
      score: /^Score$/i,
      setting: /^Reasoning effort/i,
      cost: /^Avg\. cost$/i,
      metrics: { latency: /^Avg\. latency$/i },
      name: (c) => c.text.replace(/^[★◆]\s*/, ''),
    });
    return rows.map((r) => {
      const [model, agent] = r.model.split(' · ');
      return { ...r, model: model.trim(), harness: agent?.trim() };
    });
  },
};
export default board;
