// DataCenterBench Tier 1 (Robocurve). robocurve.org/datacenterbench publishes data/model_summary.csv next to
// the page: per model and serving mode the reasoning effort, avg_at_3 (mean judged score over three runs of
// the ten tasks, 0 to 1), cost per task and output tokens per task. avg_at_3 times 100 is the score, effort
// the setting, and a serving mode after "·" in the label ("GPT-6 Astra · ultrafast") joins the setting.
// Complete entries report three run scores, task-trial counts, token use, timings and a bootstrap interval.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://robocurve.org/datacenterbench/data/model_summary.csv';

const board: Leaderboard = {
  benchmark: 'datacenterbench-tier-1',
  url: 'https://robocurve.org/datacenterbench/',
  feed: `${FEED} (avg_at_3)`,
  terms: 'CSV published next to the robocurve.org page; robots.txt allows all paths (content signals: search yes, AI training no) and the site states no other terms.',
  chart: {
    title: 'Score vs. minutes per task',
    note: 'Each point is one model and serving mode; the page plots minutes, redrawn here in seconds.',
    x: { key: 'latency', label: 'Mean time per task', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Score (avg@3)', unit: '%', better: 'higher' },
  },
  aliases: {
    'Muse Wonder': 'muse-wonder',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const v = Number(r.avg_at_3);
      if (!r.model_label || r.complete !== 'True' || !Number.isFinite(v)) continue;
      const [name, mode] = r.model_label.split(/\s*·\s*/);
      const value = (column: string, scale = 1) => r[column]?.trim() && Number.isFinite(Number(r[column])) ? Number(r[column]) * scale : undefined;
      const metrics: Record<string, number> = {};
      const columns = {
        trialsCounted: 'trials_counted',
        trialsExpected: 'trials_expected',
        unscored: 'unscored',
        notYetRun: 'not_yet_run',
        latency: 'duration_mean_s',
        medianLatency: 'duration_median_s',
        p90Latency: 'duration_p90_s',
        wallSeconds: 'wall_mean_s',
        providerCost: 'cost_per_task_usd_provider_reported',
        estimatedCost: 'cost_per_task_usd_page_est',
        totalCost: 'total_cost_usd',
        uncachedInputTokens: 'uncached_input_tokens_per_task',
        cachedTokens: 'cached_input_tokens_per_task',
        cacheWriteTokens: 'cache_write_tokens_per_task',
        reasoningTokens: 'reasoning_tokens_per_task',
        judgeAstraInputTokens: 'judge_gpt_6_astra_input_per_task',
        judgeAstraOutputTokens: 'judge_gpt_6_astra_output_per_task',
        judgeOpusInputTokens: 'judge_claude_opus_5_5_input_per_task',
        judgeOpusOutputTokens: 'judge_claude_opus_5_5_output_per_task',
        endedOverheat: 'ended_overheat',
        endedOperatorStop: 'ended_operator_stop',
        endedRunError: 'ended_run_error',
        endedCallLimit: 'ended_call_limit',
        endedModelDone: 'ended_model_done',
        endedModelGaveUp: 'ended_model_gave_up',
        endedOther: 'ended_other',
      };
      for (const [key, column] of Object.entries(columns)) {
        const n = value(column);
        if (n !== undefined) metrics[key] = n;
      }
      let trials = 0;
      for (const run of [1,2,3]) {
        const n = value('run' + run + '_score', 100);
        if (n === undefined) continue;
        trials++;
        metrics['run' + run + 'Score'] = n;
        const count = value('run' + run + '_n_scored');
        if (count !== undefined) metrics['run' + run + 'Scored'] = count;
      }
      const se = value('se_across_runs', 100);
      if (se !== undefined) metrics.runStandardError = se;
      rows.push({
        model: name.trim(), score: v * 100, trials: trials || undefined, metrics,
        setting: [r.effort, mode].filter(Boolean).join(', ') || undefined,
        cost: value('cost_per_task_usd'), tokens: value('output_tokens_incl_reasoning_per_task'),
        low: value('ci95_boot_low', 100), high: value('ci95_boot_high', 100),
      });
    }
    return rows;
  },
};
export default board;
