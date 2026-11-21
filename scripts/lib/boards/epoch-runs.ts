// Epoch's live run export. Select the exact task version to keep public/private sets and successors separate.
// Headline scores are fractions. Token fields are whole-run totals, so they are not output tokens per task.
import { fetchText, parseCsv } from '../util.ts';
import type { LeaderboardRow } from '../../leaderboards/types.ts';
export const EPOCH_RUNS_FEED = 'https://epoch.ai/data/benchmarks.csv';
export const EPOCH_SCORE_STATS = {
  meanScore: { name: 'Mean score', unit: '%', better: 'higher' as const },
  'scorer:proof_scorer': { name: 'Proof scorer score', unit: '%', better: 'higher' as const },
  'scorer:verification_code': { name: 'Verification code score', unit: '%', better: 'higher' as const },
  'scorer:furniture_score/accuracy': { name: 'Furniture assembly accuracy', unit: '%', better: 'higher' as const },
  'scorer:win_rate/all': { name: 'Win rate', unit: '%', better: 'higher' as const },
  'scorerSpread:proof_scorer': { name: 'Proof scorer spread', unit: '%' },
  'scorerSpread:verification_code': { name: 'Verification code spread', unit: '%' },
  'scorerSpread:furniture_score/accuracy': { name: 'Furniture assembly accuracy spread', unit: '%' },
  'scorerSpread:win_rate/all': { name: 'Win rate spread', unit: '%' },
  'Training compute (FLOP)': { name: 'Training compute', unit: 'count' },
  'Training compute cost (2023 USD)': { name: 'Training compute cost', unit: 'usd', better: 'lower' as const },
  'Training dataset size (datapoints)': { name: 'Training dataset size', unit: 'count' },
  'Hardware quantity': { name: 'Hardware quantity', unit: 'count' },
  activeParams: { name: 'Active parameters', unit: 'billions' },
};
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
    if (r.stderr?.trim() && Number.isFinite(Number(r.stderr))) metrics.stderr = Number(r.stderr) * 100;
    if (r.mean_score?.trim() && Number.isFinite(Number(r.mean_score))) metrics.meanScore = Number(r.mean_score) * 100;
    for (const match of (r.Scores ?? '').matchAll(/(?:^|[,;]\s*)([^,:;]+):\s*([\d.]+)(?:±([\d.]+))?/g)) {
      const key = match[1].trim();
      metrics['scorer:' + key] = Number(match[2]) * 100;
      if (match[3]) metrics['scorerSpread:' + key] = Number(match[3]) * 100;
    }
    for (const key of ['Training compute (FLOP)', 'Training dataset size (datapoints)', 'Training compute cost (2023 USD)', 'Finetune compute (FLOP)', 'Hardware quantity', 'Citations', 'Epochs', 'Batch size']) {
      if (r[key]?.trim() && Number.isFinite(Number(r[key]))) metrics[key] = Number(r[key]);
    }
    if (r['Manual evaluation'] === 'True') metrics.manualEvaluation = 1;
    const setting = [effort?.[1], r['task version'] ? `task version ${r['task version']}` : undefined].filter(Boolean).join('; ') || undefined;
    const access = r['Model accessibility'];
    const size = Number(r.Parameters);
    const active = r['Parameters notes']?.match(/\b(\d+(?:\.\d+)?)\s*(B|billion) active\b/);
    if (active) metrics.activeParams = Number(active[1]);
    const license = r['Accessibility notes']?.match(/^(Modified MIT|MIT|Apache-2\.0|Apache 2\.0)(?: [Ll]icense)?(?:$|\s)/)?.[1];
    rows.push({ model, score: score * 100, setting, harness: 'Epoch',
      open: access?.startsWith('Open weights') ? true : ['API access','Hosted access (no API)','Unreleased'].includes(access) ? false : undefined,
      params: r.Parameters?.trim() && Number.isFinite(size) && size > 0 ? size / 1e9 : undefined,
      link: [r['log viewer'], r.logs].find(url => url?.startsWith('https://')), license, date: r.started_at?.slice(0, 10) || undefined, metrics });
  }
  if (!rows.length) throw new Error(`Epoch run export has no rows for ${task}`);
  return rows;
}
