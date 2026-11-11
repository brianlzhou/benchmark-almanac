// Epoch's live run export. Select the exact task version to keep public/private sets and successors separate.
// Headline scores are fractions. Token fields are whole-run totals, so they are not output tokens per task.
import { fetchText, parseCsv } from '../util.ts';
import type { LeaderboardRow } from '../../leaderboards/types.ts';
export const EPOCH_RUNS_FEED = 'https://epoch.ai/data/benchmarks.csv';
export async function epochRunRows(task: string): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (const r of parseCsv(await fetchText(EPOCH_RUNS_FEED))) {
    if (r.task !== task || !r['Best score (across scorers)']?.trim()) continue;
    const score = Number(r['Best score (across scorers)']);
    if (!Number.isFinite(score) || score < 0 || score > 1) throw new Error(`Invalid Epoch fraction for ${task}`);
    const effort = r.model.match(/_(max|xhigh|high|medium|low|minimal|none|thinking|non-thinking|\d+[kK])$/);
    const model = effort ? r.model.slice(0, effort.index) : r.model;
    const metrics: Record<string, number> = {};
    for (const key of ['billable_input_tokens','billable_output_tokens','cache_read_tokens','cache_write_tokens']) {
      if (r[key]?.trim() && Number.isFinite(Number(r[key]))) metrics[`run_${key}`] = Number(r[key]);
    }
    if (r.stderr?.trim() && Number.isFinite(Number(r.stderr))) metrics.standardError = Number(r.stderr) * 100;
    if (r.mean_score?.trim() && Number.isFinite(Number(r.mean_score))) metrics.meanScore = Number(r.mean_score) * 100;
    const setting = [effort?.[1], r['task version'] ? `task version ${r['task version']}` : undefined].filter(Boolean).join('; ') || undefined;
    rows.push({ model, score: score * 100, setting, harness: 'Epoch', date: r.started_at?.slice(0, 10) || undefined, metrics });
  }
  if (!rows.length) throw new Error(`Epoch run export has no rows for ${task}`);
  return rows;
}
