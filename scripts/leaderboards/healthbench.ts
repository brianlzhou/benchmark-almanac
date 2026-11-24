// HealthBench overall scores from the author's launch page. In the theme chart, theme:null
// denotes the published overall value. Do not average the overlapping theme categories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, OPENAI_TERMS } from '../lib/boards/openai.ts';
const PAGE = 'https://openai.com/index/healthbench/';
const healthbenchStats: Leaderboard['stats'] = {
  'Consensus error rate:emergency_referrals': { name: 'Consensus error rate: Emergency referrals', unit: '%', better: 'lower' },
  'Consensus error rate:expertise_tailored_communication': { name: 'Consensus error rate: Expertise-tailored communication', unit: '%', better: 'lower' },
  'Consensus error rate:responding_under_uncertainty': { name: 'Consensus error rate: Responding under uncertainty', unit: '%', better: 'lower' },
  'Consensus error rate:response_depth': { name: 'Consensus error rate: Response depth', unit: '%', better: 'lower' },
  'Consensus error rate:health_data_tasks': { name: 'Consensus error rate: Health data tasks', unit: '%', better: 'lower' },
  'Consensus error rate:global_health': { name: 'Consensus error rate: Global health', unit: '%', better: 'lower' },
  'Consensus error rate:context_seeking': { name: 'Consensus error rate: Context seeking', unit: '%', better: 'lower' },
  'Consensus error rate:overall': { name: 'Consensus error rate: Overall', unit: '%', better: 'lower' },
  ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => [
    `anyFailRate:${i + 1}`,
    { name: `Worst-case failure rate at ${i + 1} ${i === 0 ? 'sample' : 'samples'}`, unit: '%', better: 'lower' as const },
  ])),
};
const board: Leaderboard = {
  benchmark: 'healthbench',
  parts: {
    emergency_referrals: { name: 'Emergency referrals', group: 'Theme' },
    expertise_tailored_communication: { name: 'Expertise-tailored communication', group: 'Theme' },
    responding_under_uncertainty: { name: 'Responding under uncertainty', group: 'Theme' },
    response_depth: { name: 'Response depth', group: 'Theme' },
    health_data_tasks: { name: 'Health data tasks', group: 'Theme' },
    global_health: { name: 'Global health', group: 'Theme' },
    context_seeking: { name: 'Context seeking', group: 'Theme' },
    'Axis:communication_quality': { name: 'Communication quality', group: 'Axis' },
    'Axis:instruction_following': { name: 'Instruction following', group: 'Axis' },
    'Axis:accuracy': { name: 'Accuracy', group: 'Axis' },
    'Axis:context_awareness': { name: 'Context awareness', group: 'Axis' },
    'Axis:completeness': { name: 'Completeness', group: 'Axis' },
    'Hard subset:communication_quality': { name: 'Communication quality', group: 'Hard subset' },
    'Hard subset:instruction_following': { name: 'Instruction following', group: 'Hard subset' },
    'Hard subset:accuracy': { name: 'Accuracy', group: 'Hard subset' },
    'Hard subset:context_awareness': { name: 'Context awareness', group: 'Hard subset' },
    'Hard subset:completeness': { name: 'Completeness', group: 'Hard subset' },
    'Hard subset:overall': { name: 'Overall', group: 'Hard subset' },
  },
  stats: healthbenchStats,
  url: PAGE, feed: `${PAGE} (HealthBench scores by theme, overall values)`, terms: OPENAI_TERMS,
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
