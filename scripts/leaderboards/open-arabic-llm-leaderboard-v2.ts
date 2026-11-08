// Open Arabic LLM Leaderboard v2 (OALL, run with Technology Innovation Institute compute). The
// OALL/Open-Arabic-LLM-Leaderboard Space builds its table from the public OALL/v2_results dataset: one
// lighteval results file per model run (<org>/<model>/results_<time>.json). For each of seven tasks the Space
// takes one metric (acc_norm, or llm_as_judge for ALRAGE), times 100, and ranks by "Average", the mean of the
// seven. This importer does the same. When a model has several results files, the newest counts. The six
// Arabic benchmarks on the board (AlGhafa, ArabicMMLU, MadinahQA, AraTrust, ALRAGE and Arabic MMLU-HT) have
// their own almanac records and importers, which read the same files through oallRows. The files are fetched
// once per sync run and shared. Repository listings follow every next-page link. A failed result file
// fails the board instead of silently omitting that model, so the sync keeps its last complete rows. The board evaluates open-weight models from the Hugging Face Hub, run by OALL.
// Most rows are community fine-tunes. Only repositories of the original model makers are offered to the
// resolver by their model name. Others keep their owner in the name ("yellowtown 7B-v0.2"), so a fine-tune
// is never read as its base model. The registry keeps one record per model family, so a pretrained base
// checkpoint ("Qwen/Qwen2.5-72B", "google/gemma-3-27b-pt") carries the setting "base model".
import type { Leaderboard, LeaderboardRow } from './types.ts';

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

let requestedAt = 0;
/** Pace every Hugging Face request, including redirects, and never send a token to another host. */
async function oallResponse(url: string): Promise<Response> {
  for (let redirects = 0; redirects < 6; redirects++) {
    const target = new URL(url);
    if (target.origin !== 'https://huggingface.co') throw new Error(`unexpected OALL host: ${target.origin}`);
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const wait = 2100 - (Date.now() - requestedAt);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      requestedAt = Date.now();
      response = await fetch(url, {
        headers: {
          'user-agent': 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)',
          ...(process.env.HF_TOKEN ? { authorization: `Bearer ${process.env.HF_TOKEN}` } : {}),
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(60_000),
      });
      if (response.status !== 429 && response.status < 500) break;
      if (attempt === 2) break;
      const retry = response.headers.get('retry-after');
      const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : 0;
      const dateWait = retry && !seconds ? Date.parse(retry) - Date.now() : 0;
      const backoff = Math.max(10_000 * (attempt + 1), seconds * 1000, Number.isFinite(dateWait) ? dateWait : 0);
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
    if (!response) throw new Error(`no OALL response: ${url}`);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`OALL redirect has no location: ${url}`);
      await response.body?.cancel();
      url = new URL(location, url).href;
      continue;
    }
    if (!response.ok) throw new Error(`${response.status} OALL result or listing: ${url}`);
    return response;
  }
  throw new Error(`OALL redirect limit: ${url}`);
}

/** One entry per model: the newest results file, with each task's score (0 to 100). */
function runs(): Promise<Run[]> {
  cache ??= (async () => {
    const newest = new Map<string, string>();
    const seen = new Set<string>();
    let page: string | undefined = TREE;
    while (page) {
      if (seen.has(page)) throw new Error(`OALL listing cursor repeated: ${page}`);
      seen.add(page);
      const response = await oallResponse(page);
      const tree = await response.json() as { type: string; path: string }[];
      if (!Array.isArray(tree)) throw new Error(`OALL listing is not an array: ${page}`);
      for (const f of tree) {
        const parts = f.path.split('/');
        if (f.type !== 'file' || parts.length !== 3 || !parts[2].startsWith('results_') || !f.path.endsWith('.json')) continue;
        const model = `${parts[0]}/${parts[1]}`;
        if (!newest.has(model) || newest.get(model)! < f.path) newest.set(model, f.path);
      }
      const next = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="?next"?/i)?.[1];
      page = next ? new URL(next, page).href : undefined;
      if (page && (new URL(page).origin !== 'https://huggingface.co' || new URL(page).pathname !== new URL(TREE).pathname)) {
        throw new Error(`unexpected OALL listing continuation: ${page}`);
      }
    }
    const out: Run[] = [];
    for (const path of newest.values()) {
      // A failed or malformed file must fail the board. The sync then preserves its previous complete rows.
      const data = await (await oallResponse(FILE(path))).json() as {
        config_general?: { model_name?: string };
        results?: Record<string, Record<string, number>>;
      };
      if (!data?.results || typeof data.results !== 'object') throw new Error(`OALL file has no results: ${path}`);
      const scores: Partial<Record<OallTask, number>> = {};
      for (const [name, [key, metric]] of Object.entries(OALL_TASKS) as [OallTask, readonly [string, string]][]) {
        const v = data.results[key]?.[metric];
        if (typeof v === 'number' && Number.isFinite(v)) scores[name] = v * 100;
      }
      if (!Object.keys(scores).length) throw new Error(`OALL file has no recognized scores: ${path}`);
      const date = path.match(/results_(\d{4}-\d\d-\d\d)/)?.[1] ?? '';
      out.push({ model: data.config_general?.model_name ?? path.split('/').slice(0, 2).join('/'), date, scores });
    }
    if (!out.length) throw new Error('no OALL results read');
    return out;
  })();
  return cache;
}

// Hub owners whose repositories are the original releases
const MAKERS = new Set(['Qwen', 'meta-llama', 'google', 'CohereForAI', 'CohereLabs', 'microsoft', 'deepseek-ai', 'mistralai', '01-ai', 'inceptionai', 'QCRI', 'ALLaM-AI', 'tiiuae', 'ibm-granite', 'allenai', 'nvidia', 'openai']);
// pretrained checkpoints: an explicit -Base or -pt suffix, or the families whose plain name is the base model
const BASE = /(-Base|-pt)$|^Qwen\/Qwen(1\.5|2|2\.5)-[\d.]+B$|^meta-llama\/(Meta-)?Llama-3(\.\d)?-\d+B$|^google\/gemma-2?-\d+b$|^01-ai\/Yi-1\.5-\d+B(-32K)?$/i;

/** The name offered to the resolver and the setting, for one Hub repository id. */
function name(repo: string): { model: string; setting?: string } {
  const [owner] = repo.split('/');
  if (!MAKERS.has(owner)) return { model: repo.replace('/', ' ') };
  return { model: repo, setting: BASE.test(repo) ? 'base model' : undefined };
}

/** Rows for one task column, or for "Average" (the mean of the tasks a run has, as the Space computes it). */
export async function oallRows(column: OallTask | 'Average'): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (const r of await runs()) {
    const values = Object.values(r.scores);
    const score = column === 'Average' ? (values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined) : r.scores[column];
    if (score === undefined) continue;
    rows.push({ ...name(r.model), score, date: r.date || undefined });
  }
  return rows;
}

/** Hub names the shared resolver cannot place, shared by the OALL importers. */
// keys without the Hub owner, which the resolver drops before its second lookup. Instruct checkpoints map to
// the family record, and their base checkpoints carry the setting "base model".
export const OALL_ALIASES: Record<string, string> = {
  'Qwen2.5-0.5B-Instruct': 'qwen2-5-0-5b',
  'Qwen2.5-1.5B-Instruct': 'qwen2-5-1-5b',
  'Qwen2.5-3B-Instruct': 'qwen2-5-3b',
  'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
  'Qwen2.5-14B-Instruct': 'qwen2-5-14b',
  'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
  'Qwen3-1.7B-Base': 'qwen3-1-7b',
  'Qwen3-4B-Base': 'qwen3-4b',
  'Qwen3-8B-Base': 'qwen3-8b',
  'Qwen3-14B-Base': 'qwen3-14b',
  'Qwen3-30B-A3B-Instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
  'gemma-2-9b-it': 'gemma-2-9b',
  'gemma-2-27b-it': 'gemma-2-27b',
  'gemma-3-4b-pt': 'gemma-3-4b',
  'gemma-3-12b-pt': 'gemma-3-12b',
  'gemma-3-27b-pt': 'gemma-3-27b',
  'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
  'Llama-3.2-3B-Instruct': 'llama-3-2-3b',
  'Phi-4-mini-instruct': 'phi-4-mini',
};

const board: Leaderboard = {
  benchmark: 'open-arabic-llm-leaderboard-v2',
  url: OALL_URL,
  feed: oallFeed('Average'),
  terms: OALL_TERMS,
  aliases: OALL_ALIASES,
  fetch: () => oallRows('Average'),
};
export default board;
