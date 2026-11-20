// HealthBench overall scores from the author's launch page. In the theme chart, theme:null
// denotes the published overall value. Do not average the overlapping theme categories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, OPENAI_TERMS } from '../lib/boards/openai.ts';
const PAGE = 'https://openai.com/index/healthbench/';
const board: Leaderboard = {
  benchmark: 'healthbench', parts: {
  emergency_referrals: { name: 'Emergency referrals', group: 'Category' },
  expertise_tailored_communication: { name: 'Expertise tailored communication', group: 'Category' },
  responding_under_uncertainty: { name: 'Responding under uncertainty', group: 'Category' },
  response_depth: { name: 'Response depth', group: 'Category' },
  health_data_tasks: { name: 'Health data tasks', group: 'Category' },
  global_health: { name: 'Global health', group: 'Category' },
  context_seeking: { name: 'Context seeking', group: 'Category' },
}, url: PAGE, feed: `${PAGE} (HealthBench scores by theme, overall values)`, terms: OPENAI_TERMS,
  aliases: { 'Gemini 2.5 Pro (Mar 2025)': 'gemini-2-5-pro-mar-2025', 'GPT-4o (Aug 2024)': 'gpt-4o-aug-2024' },
  async fetch() {
    const charts = await openaiSpecs(PAGE);
    const values = chartValues(charts, 'HealthBench scores by theme');
    const axes = chartValues(charts, 'HealthBench scores by axis');
    const hard = chartValues(charts, 'HealthBench Hard subset scores by axis');
    const worst = chartValues(charts, 'Worst-case HealthBench score at k samples');
    const consensus = chartValues(charts, 'HealthBench Consensus error rate by theme');
    const rows: LeaderboardRow[] = [];
    for (const r of values) {
      if (r.theme !== null || typeof r.model !== 'string' || typeof r.success_rate !== 'number') continue;
      let model = r.model.replace(/\s+/g, ' ').trim();
      if (model === 'GPT-3.5 Turbo') model += ' (snapshot unspecified)';
      const metrics: Record<string, number> = {};
      for (const [group, points] of [['Theme', values], ['Axis', axes], ['Hard subset', hard], ['Consensus error rate', consensus]] as const) {
        for (const part of points) {
          if (part.model !== r.model || typeof part.success_rate !== 'number') continue;
          if (!part.theme && (group === 'Theme' || group === 'Axis')) continue;
          const name = String(part.theme ?? 'Overall');
          const stem = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          const key = group === 'Theme' ? stem : group + ':' + stem;
          metrics[key] = part.success_rate * 100;
          if (typeof part.success_rate_lower === 'number') metrics[key + ':low'] = part.success_rate_lower * 100;
          if (typeof part.success_rate_upper === 'number') metrics[key + ':high'] = part.success_rate_upper * 100;
          if (group !== 'Consensus error rate') board.parts![key] = { name, group };
        }
      }
      for (const point of worst) {
        if (point.model === r.model && typeof point.any_fail_rate === 'number') metrics['anyFailRate:' + point.k] = point.any_fail_rate * 100;
      }
      rows.push({ model, score: r.success_rate * 100, metrics,
        low: typeof r.success_rate_lower === 'number' ? r.success_rate_lower * 100 : undefined,
        high: typeof r.success_rate_upper === 'number' ? r.success_rate_upper * 100 : undefined });
    }
    if (!rows.length) throw new Error('HealthBench overall values missing');
    return rows;
  },
};
export default board;
