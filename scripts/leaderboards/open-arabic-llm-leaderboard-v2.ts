// Open Arabic LLM Leaderboard v2 (OALL, run with Technology Innovation Institute compute). The
// OALL/Open-Arabic-LLM-Leaderboard Space builds its table from the public OALL/v2_results dataset: one
// lighteval results file per model run (<org>/<model>/results_<time>.json). For each of seven tasks the Space
// takes one metric (acc_norm, or llm_as_judge for ALRAGE), times 100, and ranks by "Average", the mean of the
// seven. This importer does the same. When a model has several results files, the newest counts. The six
// Arabic benchmarks on the board (AlGhafa, ArabicMMLU, MadinahQA, AraTrust, ALRAGE and Arabic MMLU-HT) have
// their own almanac records and importers, which read the same files through oallRows. The files are fetched
// once per sync run and shared. The board evaluates open-weight models from the Hugging Face Hub, run by OALL.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const REPO = 'OALL/v2_results';
const TREE = `https://huggingface.co/api/datasets/${REPO}/tree/main?recursive=1`;
const FILE = (path: string) => `https://huggingface.co/datasets/${REPO}/resolve/main/${path}`;

/** The Space's seven tasks: lighteval task key, metric and column name. */
export const OALL_TASKS = {
  AlGhafa: ['community|alghafa:_average|0', 'acc_norm'],
  ArabicMMLU: ['community|arabic_mmlu:_average|0', 'acc_norm'],
  EXAMS: ['community|arabic_exams|0', 'acc_norm'],
  MadinahQA: ['community|madinah_qa:_average|0', 'acc_norm'],
  AraTrust: ['community|aratrust:_average|0', 'acc_norm'],
  ALRAGE: ['community|alrage_qa|0', 'llm_as_judge'],
  'ArbMMLU-HT': ['community|arabic_mmlu_ht:_average|0', 'acc_norm'],
} as const;
export type OallTask = keyof typeof OALL_TASKS;

export const OALL_URL = 'https://huggingface.co/spaces/OALL/Open-Arabic-LLM-Leaderboard';
export const OALL_TERMS = 'Public Hugging Face dataset OALL/v2_results, read as the Apache-2.0 leaderboard Space reads it; the dataset states no license.';
export const oallFeed = (column: string) => `https://huggingface.co/datasets/${REPO} (results_*.json, ${column})`;

interface Run {
  model: string;
  date: string;
  scores: Partial<Record<OallTask, number>>;
}

let cache: Promise<Run[]> | undefined;

/** One entry per model: the newest results file, with each task's score (0 to 100). */
function runs(): Promise<Run[]> {
  cache ??= (async () => {
    const tree = await fetchJson<{ type: string; path: string }[]>(TREE);
    const newest = new Map<string, string>();
    for (const f of tree) {
      const parts = f.path.split('/');
      if (f.type !== 'file' || parts.length !== 3 || !parts[2].startsWith('results_') || !f.path.endsWith('.json')) continue;
      const model = `${parts[0]}/${parts[1]}`;
      if (!newest.has(model) || newest.get(model)! < f.path) newest.set(model, f.path);
    }
    const paths = [...newest.values()];
    const out: Run[] = [];
    for (let i = 0; i < paths.length; i += 8) {
      const batch = await Promise.all(
        paths.slice(i, i + 8).map((p) =>
          fetchJson<{ config_general?: { model_name?: string }; results?: Record<string, Record<string, number>> }>(FILE(p)).catch(() => null),
        ),
      );
      batch.forEach((data, j) => {
        if (!data?.results) return;
        const path = paths[i + j];
        const scores: Partial<Record<OallTask, number>> = {};
        for (const [name, [key, metric]] of Object.entries(OALL_TASKS) as [OallTask, readonly [string, string]][]) {
          const v = data.results[key]?.[metric];
          if (typeof v === 'number' && Number.isFinite(v)) scores[name] = v * 100;
        }
        const date = path.match(/results_(\d{4}-\d\d-\d\d)/)?.[1] ?? '';
        out.push({ model: data.config_general?.model_name ?? path.split('/').slice(0, 2).join('/'), date, scores });
      });
    }
    if (!out.length) throw new Error('no OALL results read');
    return out;
  })();
  return cache;
}

/** Rows for one task column, or for "Average" (the mean of the tasks a run has, as the Space computes it). */
export async function oallRows(column: OallTask | 'Average'): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (const r of await runs()) {
    const values = Object.values(r.scores);
    const score = column === 'Average' ? (values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined) : r.scores[column];
    if (score === undefined) continue;
    rows.push({ model: r.model, score, date: r.date || undefined });
  }
  return rows;
}

/** Hub names the shared resolver cannot place, shared by the OALL importers. */
export const OALL_ALIASES: Record<string, string> = {};

const board: Leaderboard = {
  benchmark: 'open-arabic-llm-leaderboard-v2',
  url: OALL_URL,
  feed: oallFeed('Average'),
  terms: OALL_TERMS,
  aliases: OALL_ALIASES,
  fetch: () => oallRows('Average'),
};
export default board;
