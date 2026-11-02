// HELM Capabilities (Stanford CRFM). Every HELM leaderboard at crfm.stanford.edu/helm/<project>/ is built from
// files in the public crfm-helm-public bucket, as air-bench-2024.ts describes. helmRows lists the project's
// releases (or, for older projects, run suites) through the bucket's JSON API, takes the newest, and reads one
// table from one group file. Each row is named by the model id in its HELM run spec, without the org prefix
// ("openai_gpt-4o-2024-05-13" becomes "gpt-4o-2024-05-13"), because display names are loose; a date stamp
// in the id becomes the row date. Rows with no run spec fall back to the display name. HELM stores scores
// as fractions, so most boards pass scale 100. The other HELM importers use helmRows and HELM_ALIASES.
//
// This board: core_scenarios.json, table "Accuracy", column "Mean score" (the mean over MMLU-Pro, GPQA,
// IFEval, WildBench and Omni-MATH), times 100.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import airBench from './air-bench-2024.ts';

export const HELM_BUCKET = 'https://storage.googleapis.com/crfm-helm-public';
export const HELM_TERMS = 'Public HELM output bucket that the leaderboard reads; the HELM code is Apache-2.0.';
/** HELM run-spec model ids the shared resolver cannot place (the AIR-Bench importer's list). */
export const HELM_ALIASES: Record<string, string> = { ...(airBench.aliases ?? {}) };

export interface HelmTable {
  /** Bucket folder, such as "lite" or "safety". */
  project: string;
  /** "releases" for most projects, "runs" for the ones that publish run suites only. */
  kind?: 'releases' | 'runs';
  /** Group file name without .json, such as "core_scenarios". */
  group: string;
  /** Table title inside the group file; the first table when not given. */
  table?: string;
  /** Header of the score column. */
  column: string;
  /** Multiplier for the stored value, 100 for fractions. */
  scale?: number;
}

const version = (p: string) => (p.match(/v(\d+)\.(\d+)\.(\d+)\/$/)?.slice(1) ?? []).map(Number);

/** The bucket folder of the newest release (or run suite) of a HELM project, ending in a slash. */
export async function helmNewest(project: string, kind: 'releases' | 'runs' = 'releases'): Promise<string> {
  const list = `https://storage.googleapis.com/storage/v1/b/crfm-helm-public/o?prefix=${project}/benchmark_output/${kind}/&delimiter=/`;
  const { prefixes = [] } = await fetchJson<{ prefixes?: string[] }>(list);
  const newest = prefixes
    .filter((p) => version(p).length === 3)
    .sort((a, b) => {
      const [x, y] = [version(a), version(b)];
      return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
    })
    .at(-1);
  if (!newest) throw new Error(`no ${kind} for ${project} in the HELM bucket`);
  return newest;
}

/** The feed description for a HELM table, for the Leaderboard's feed field. */
export const helmFeed = (t: HelmTable) =>
  `${HELM_BUCKET}/${t.project}/benchmark_output/${t.kind ?? 'releases'}/<newest>/groups/${t.group}.json (${t.table ? `${t.table}: ` : ''}${t.column})`;

interface Cell {
  value?: string | number | null;
  run_spec_names?: string[];
}
interface Table {
  title?: string;
  header: { value: string }[];
  rows: Cell[][];
}

export async function helmRows(t: HelmTable): Promise<LeaderboardRow[]> {
  const newest = await helmNewest(t.project, t.kind);
  const tables = await fetchJson<Table[]>(`${HELM_BUCKET}/${newest}groups/${t.group}.json`);
  const table = t.table ? tables.find((x) => x.title === t.table) : tables[0];
  const col = table?.header.findIndex((h) => h.value === t.column) ?? -1;
  if (!table || col < 0) throw new Error(`no "${t.column}" column in ${t.project} ${t.group}.json`);
  const rows: LeaderboardRow[] = [];
  for (const r of table.rows) {
    const score = r[col]?.value;
    if (typeof score !== 'number' || !Number.isFinite(score)) continue;
    const spec = r.flatMap((c) => c.run_spec_names ?? []).map((s) => s.match(/model=([^,]+)/)?.[1]).find(Boolean);
    let model = spec ? spec.replace(/^[a-z0-9-]+_/, '') : String(r[0]?.value ?? '').trim();
    if (!model) continue;
    const settings: string[] = [];
    if (/-with-guardian$/.test(model)) {
      model = model.replace(/-with-guardian$/, '');
      settings.push('with guardian');
    }
    if (/-safety-block-none$/.test(model)) {
      model = model.replace(/-safety-block-none$/, '');
      settings.push('BLOCK_NONE safety');
    }
    const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
    rows.push({
      model,
      score: score * (t.scale ?? 1),
      setting: settings.join(', ') || undefined,
      date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined,
    });
  }
  if (!rows.length) throw new Error(`no scored rows in ${t.project} ${t.group}.json`);
  return rows;
}

const TABLE: HelmTable = { project: 'capabilities', group: 'core_scenarios', table: 'Accuracy', column: 'Mean score', scale: 100 };

const board: Leaderboard = {
  benchmark: 'helm-capabilities',
  url: 'https://crfm.stanford.edu/helm/capabilities/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
