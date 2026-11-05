// DataCenterBench Tier 1 (Robocurve). robocurve.org/datacenterbench publishes data/model_summary.csv next to
// the page: per model and serving mode the reasoning effort, avg_at_3 (mean judged score over three runs of
// the ten tasks, 0 to 1), cost per task and output tokens per task. avg_at_3 times 100 is the score, effort
// the setting, and a serving mode after "·" in the label ("GPT-6 Astra · ultrafast") joins the setting.
// Only rows marked complete are read. Each row also carries duration_mean_s as "time" (seconds per task), which
// the page's "Score vs. minutes per task" scatter plots, and the table's 95% bootstrap interval over tasks
// ("ciLow" and "ciHigh", %).
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
    x: { key: 'time', label: 'Mean time per task', unit: 's', better: 'lower', log: true },
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
      const cost = Number(r.cost_per_task_usd);
      const tokens = Number(r.output_tokens_incl_reasoning_per_task);
      rows.push({
        model: name.trim(),
        score: v * 100,
        setting: [r.effort, mode].filter(Boolean).join(', ') || undefined,
        cost: Number.isFinite(cost) ? cost : undefined,
        tokens: Number.isFinite(tokens) ? tokens : undefined,
        metrics: Object.fromEntries(
          (
            [
              ['time', r.duration_mean_s, 1],
              ['ciLow', r.ci95_boot_low, 100],
              ['ciHigh', r.ci95_boot_high, 100],
            ] as const
          )
            .filter(([, raw]) => raw?.trim() && Number.isFinite(Number(raw)))
            .map(([k, raw, x]) => [k, Number((Number(raw) * x).toFixed(2))]),
        ),
      });
    }
    return rows;
  },
};
export default board;
