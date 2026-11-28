// Shared reader for the AllenAI VLA Evaluation Harness leaderboard JSON.
// One cached fetch serves all benchmark slices hosted on the harness.
import type { BoardPart, Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';

const FEED = 'https://allenai.github.io/vla-evaluation-harness/leaderboard/leaderboard.json';
const URL = 'https://allenai.github.io/vla-evaluation-harness/leaderboard/';

interface VlaEntry {
  model?: string;
  display_name?: string;
  name_in_paper?: string;
  benchmark: string;
  overall_score: number | null;
  suite_scores?: Record<string, number | null>;
  task_scores?: Record<string, number | null>;
  reported_paper?: string | null;
  weight_type?: string | null;
  params?: number | null;
}

interface VlaPayload {
  last_updated?: string;
  results: VlaEntry[];
}

export interface VlaPartSpec {
  /** Key in `suite_scores` or `task_scores` from the harness JSON. */
  sourceKey: string;
  /** Plain English label declared in `Leaderboard.parts`. */
  name: string;
  /** Whether to read from `suite_scores` or `task_scores`. */
  source: 'suite' | 'task';
}

export interface VlaBoardOptions {
  benchmark: string;
  /** Exact `benchmark` key inside `leaderboard.json`. */
  vlaBenchmark: string;
  headline?: string;
  /**
   * When set, uses `suite_scores[headlineSuite]` as the headline score instead of `overall_score`.
   * Used for suite-only boards such as Kinetix where the harness intentionally leaves `overall_score` null.
   */
  headlineSuite?: string;
  /** Static mapping of metric key to source key and plain English part label. */
  partSpecs: Record<string, VlaPartSpec>;
  minimum: number;
}

let cached: Promise<VlaPayload> | null = null;

function loadPayload(): Promise<VlaPayload> {
  if (!cached) {
    cached = fetchJson<VlaPayload>(FEED);
  }
  return cached;
}

function cleanLink(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return /^https?:\/\/\S+$/.test(trimmed) ? trimmed : undefined;
}

function formatWeightType(wt: string | null | undefined): string | undefined {
  if (wt === 'shared') return 'Shared weights';
  if (wt === 'finetuned') return 'Finetuned';
  return undefined;
}

export function vlaEvalHarnessBoard(opts: VlaBoardOptions): Leaderboard {
  const parts: Record<string, string | BoardPart> = {};
  for (const [key, spec] of Object.entries(opts.partSpecs)) {
    parts[key] = spec.name;
  }

  return {
    benchmark: opts.benchmark,
    host: 'AllenAI VLA Evaluation Harness',
    url: URL,
    feed: FEED,
    terms: 'The AllenAI VLA Evaluation Harness publishes its benchmark leaderboard as a public JSON file in its open-source repository.',
    ...(opts.headline ? { headline: opts.headline } : {}),
    parts,
    async fetch(): Promise<LeaderboardRow[]> {
      const payload = await loadPayload();
      if (!Array.isArray(payload.results)) {
        throw new Error('Unexpected VLA Evaluation Harness payload: missing results array');
      }

      const rows: LeaderboardRow[] = [];
      for (const entry of payload.results) {
        if (entry.benchmark !== opts.vlaBenchmark) continue;

        const score = opts.headlineSuite
          ? entry.suite_scores?.[opts.headlineSuite]
          : entry.overall_score;
        if (typeof score !== 'number' || !Number.isFinite(score)) continue;

        const model = (entry.display_name || entry.name_in_paper || entry.model || '').trim();
        if (!model) continue;

        const metrics: Record<string, number> = {};
        for (const [metricKey, spec] of Object.entries(opts.partSpecs)) {
          const bag = spec.source === 'suite' ? entry.suite_scores : entry.task_scores;
          const val = bag?.[spec.sourceKey];
          if (typeof val === 'number' && Number.isFinite(val)) {
            metrics[metricKey] = val;
          }
        }

        rows.push({
          model,
          score,
          setting: formatWeightType(entry.weight_type),
          link: cleanLink(entry.reported_paper),
          ...(typeof entry.params === 'number' && Number.isFinite(entry.params) && entry.params > 0
            ? { params: entry.params }
            : {}),
          ...(Object.keys(metrics).length ? { metrics } : {}),
        });
      }

      if (rows.length < opts.minimum) {
        throw new Error(`Expected at least ${opts.minimum} rows for ${opts.benchmark}, got ${rows.length}`);
      }
      return rows;
    },
  };
}
