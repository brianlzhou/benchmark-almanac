// Snorkel EE v2 publishes its table and Pareto axes in a JSON feed. Pass@1 is the default score.
// Cost / Trial covers one attempt. Cost / Task covers the five-attempt evaluation and is retained separately.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
export function snorkelEE(benchmark: string, slug: string, feedName: string): Leaderboard {
  const feed = `https://snorkel.ai/benchmark-data/${feedName}.json`;
  return { benchmark, url: `https://snorkel.ai/leaderboard/${slug}/`, feed,
    terms: 'Snorkel website terms prohibit automated extraction and republication; the almanac credits Snorkel AI and links the source.',
    aliases: { 'Nemotron 3 Ultra 550B': 'nemotron-3-ultra', 'Gemini Flash 3.8': 'gemini-3-8-flash' },
    chart: { title: 'Pass@1 vs. cost per trial', x: { key: 'cost', label: 'Cost per trial', unit: '$', better: 'lower' }, y: { key: 'score', label: 'Pass@1', unit: '%', better: 'higher' } },
    async fetch(): Promise<LeaderboardRow[]> {
      const data = await fetchJson<{ rows: { model: string; score: number; pass_at_5?: number; cost_per_trial?: number; cost_per_task?: number }[] }>(feed);
      const rows = data.rows.filter(r => r.model && Number.isFinite(r.score)).map(r => ({
        model: /^(Opus|Fable|Haiku|Sonnet)\b/.test(r.model) ? `Claude ${r.model}` : r.model,
        score: r.score, cost: r.cost_per_trial,
        metrics: { ...(typeof r.pass_at_5 === 'number' ? { pass5: r.pass_at_5 } : {}), ...(typeof r.cost_per_task === 'number' ? { costFiveAttempts: r.cost_per_task } : {}) },
      }));
      if (!rows.length) throw new Error('Snorkel EE v2 rows missing');
      return rows;
    },
  };
}
