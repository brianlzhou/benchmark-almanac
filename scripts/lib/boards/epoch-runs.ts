// Epoch's live run export. Select the exact task version to keep public/private sets and successors separate.
// Headline scores are fractions. Token fields are whole-run totals, so they are not output tokens per task.
import { fetchText, parseCsv } from '../util.ts';
import type { LeaderboardRow } from '../../leaderboards/types.ts';
export const EPOCH_RUNS_FEED = 'https://epoch.ai/data/benchmarks.csv';
export const EPOCH_TERMS = 'Epoch AI publishes its benchmark data under CC BY 4.0. The almanac credits and links Epoch AI.';
export const EPOCH_SCORE_STATS = {
  meanScore: { name: 'Mean score', unit: '%', better: 'higher' as const },
  run_billable_input_tokens: { name: 'Run billable input tokens', unit: 'tokens', better: 'lower' as const },
  run_billable_output_tokens: { name: 'Run billable output tokens', unit: 'tokens', better: 'lower' as const },
  run_cache_read_tokens: { name: 'Run cache read tokens', unit: 'tokens' },
  run_cache_write_tokens: { name: 'Run cache write tokens', unit: 'tokens', better: 'lower' as const },
  'scorer:proof_scorer': { name: 'Proof scorer score', unit: '%', better: 'higher' as const },
  'scorer:verification_code': { name: 'Verification code score', unit: '%', better: 'higher' as const },
  'scorer:furniture_score/accuracy': { name: 'Furniture assembly accuracy', unit: '%', better: 'higher' as const },
  'scorer:win_rate/all': { name: 'Win rate', unit: '%', better: 'higher' as const },
  'scorer:manual_inspection': { name: 'Manual inspection score', unit: '%', better: 'higher' as const },
  'scorer:bench/exact': { name: 'Exact match score', unit: '%', better: 'higher' as const },
  'scorer:ebr_scorer': { name: 'EBR scorer accuracy', unit: '%', better: 'higher' as const },
  'scorer:normalized_string_match': { name: 'Normalized string match score', unit: '%', better: 'higher' as const },
  'scorer:sympy_equiv': { name: 'SymPy equivalence score', unit: '%', better: 'higher' as const },
  'scorer:model_graded_equiv': { name: 'Model graded equivalence score', unit: '%', better: 'higher' as const },
  'scorer:solve_at_100': { name: 'End to end solve rate', unit: '%', better: 'higher' as const },
  'scorer:agent_submitted_next_move_scorer': { name: 'Submitted next move accuracy', unit: '%', better: 'higher' as const },
  'scorer:exact_match_next_move_scorer': { name: 'Exact match next move accuracy', unit: '%', better: 'higher' as const },
  'scorer:model_extracted_exact_match': { name: 'Extracted exact match score', unit: '%', better: 'higher' as const },
  'scorer:model_graded': { name: 'Model graded score', unit: '%', better: 'higher' as const },
  'scorer:exact': { name: 'Exact match score', unit: '%', better: 'higher' as const },
  'scorer:choice': { name: 'Multiple choice accuracy', unit: '%', better: 'higher' as const },
  'scorer:simpleqa_scorer': { name: 'SimpleQA scorer accuracy', unit: '%', better: 'higher' as const },
  'scorer:swe_bench_scorer': { name: 'SWE-bench scorer accuracy', unit: '%', better: 'higher' as const },
  'scorerSpread:proof_scorer': { name: 'Proof scorer spread', unit: '%' },
  'scorerSpread:verification_code': { name: 'Verification code spread', unit: '%' },
  'scorerSpread:furniture_score/accuracy': { name: 'Furniture assembly accuracy spread', unit: '%' },
  'scorerSpread:win_rate/all': { name: 'Win rate spread', unit: '%' },
  'scorerSpread:manual_inspection': { name: 'Manual inspection spread', unit: '%' },
  'scorerSpread:bench/exact': { name: 'Exact match spread', unit: '%' },
  'scorerSpread:ebr_scorer': { name: 'EBR scorer spread', unit: '%' },
  'scorerSpread:normalized_string_match': { name: 'Normalized string match spread', unit: '%' },
  'scorerSpread:sympy_equiv': { name: 'SymPy equivalence spread', unit: '%' },
  'scorerSpread:model_graded_equiv': { name: 'Model graded equivalence spread', unit: '%' },
  'scorerSpread:solve_at_100': { name: 'End to end solve rate spread', unit: '%' },
  'scorerSpread:agent_submitted_next_move_scorer': { name: 'Submitted next move spread', unit: '%' },
  'scorerSpread:exact_match_next_move_scorer': { name: 'Exact match next move spread', unit: '%' },
  'scorerSpread:model_extracted_exact_match': { name: 'Extracted exact match spread', unit: '%' },
  'scorerSpread:model_graded': { name: 'Model graded spread', unit: '%' },
  'scorerSpread:exact': { name: 'Exact match spread', unit: '%' },
  'scorerSpread:choice': { name: 'Multiple choice spread', unit: '%' },
  'scorerSpread:simpleqa_scorer': { name: 'SimpleQA scorer spread', unit: '%' },
  'scorerSpread:swe_bench_scorer': { name: 'SWE-bench scorer spread', unit: '%' },
  'Training compute (FLOP)': { name: 'Training compute', unit: 'count' },
  'Training compute cost (2023 USD)': { name: 'Training compute cost', unit: 'usd', better: 'lower' as const },
  'Training dataset size (datapoints)': { name: 'Training dataset size', unit: 'count' },
  'Finetune compute (FLOP)': { name: 'Finetune compute', unit: 'count' },
  'Hardware quantity': { name: 'Hardware count', unit: 'count' },
  Citations: { name: 'Model paper citations', unit: 'count' },
  Epochs: { name: 'Training epochs', unit: 'count' },
  'Batch size': { name: 'Training batch size', unit: 'count' },
  activeParams: { name: 'Active parameters', unit: 'billions' },
};
let cachedCsv: Promise<Record<string, string>[]> | undefined;
function epochCsv(): Promise<Record<string, string>[]> {
  cachedCsv ??= fetchText(EPOCH_RUNS_FEED).then(parseCsv);
  return cachedCsv;
}
export async function epochRunRows(task: string): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (const r of await epochCsv()) {
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
    const setting = [effort?.[1], r['task version'] ? `task version ${r['task version']}` : undefined].filter(Boolean).join(', ') || undefined;
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
