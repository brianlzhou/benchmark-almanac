// SuperGLUE. super.gluebenchmark.com is a React app that reads its board from the public Firebase Realtime
// Database behind it (mtl-sentence-representations), which answers plain REST reads of .json paths. The page
// lists the submissions in superglue/resultsVisibility that are admin-approved and public, reads each one from
// superglue/results/<id>, drops runs on a SuperGLUE version other than 2.0, and keeps the best macro score per
// uploader. This file does the same. The headline is the overall Score (macroScore x 100). The per-task
// boards (boolq.ts, wsc.ts, cb.ts) reuse superglueRows with a task's own number. Rows carry the submission
// date. Baselines (human, most frequent class, CBoW) are kept as rows and fall out at name matching.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DB = 'https://mtl-sentence-representations.firebaseio.com';
export const SUPERGLUE_PAGE = 'https://super.gluebenchmark.com/leaderboard';
export const SUPERGLUE_FEED = `${DB}/superglue/results/<id>.json (Firebase REST, ids from superglue/resultsVisibility.json)`;
export const SUPERGLUE_TERMS =
  'super.gluebenchmark.com robots.txt sets no rules (content-signal comments only); the Firebase host robots.txt allows *.json; the site publishes no terms.';

/** Board names the shared resolver cannot place. */
export const SUPERGLUE_ALIASES: Record<string, string> = {
  // the T5 team's entry is the 11B model (11,000,000,000 parameters in the submission)
  T5: 't5-11b',
  'GPT-3 few-shot - OpenAI': 'gpt-3-175b-davinci',
};

interface Task {
  identifier: string;
  auxiliaryType?: string;
}
interface TaskResult {
  score: number;
  accuracy?: number;
}
interface Result {
  createdOn: number;
  macroScore?: number;
  microScore?: number;
  superglueVersion?: number;
  uploaderUid: string;
  editable?: { name?: string; url?: string };
  tasks?: Record<string, TaskResult>;
}

/**
 * The board's rows: per uploader, the best SuperGLUE 2.0 submission. `pick` returns the number to keep
 * (0 to 1) from the submission and the task id map, or undefined to skip it.
 */
export async function superglueRows(
  pick: (r: Result, task: (identifier: string) => TaskResult | undefined) => number | undefined,
  metricsFn?: (r: Result, task: (identifier: string) => TaskResult | undefined) => Record<string, number> | undefined,
): Promise<LeaderboardRow[]> {
  const [vis, tasks] = await Promise.all([
    fetchJson<Record<string, { adminApproved?: boolean; public?: boolean }>>(`${DB}/superglue/resultsVisibility.json`),
    fetchJson<Record<string, Task>>(`${DB}/superglue/tasks.json`),
  ]);
  const taskId = new Map(Object.entries(tasks).map(([id, t]) => [t.identifier, id]));
  const ids = Object.entries(vis)
    .filter(([, v]) => v.adminApproved && v.public)
    .map(([id]) => id);
  const results: Result[] = [];
  for (const id of ids) {
    const r = await fetchJson<Result | null>(`${DB}/superglue/results/${id}.json`);
    if (r && (r.superglueVersion ?? 1.9).toFixed(1) === '2.0' && typeof r.macroScore === 'number') results.push(r);
  }
  if (results.length < 10) throw new Error(`only ${results.length} SuperGLUE results`);
  const best = new Map<string, Result>();
  for (const r of results) {
    const b = best.get(r.uploaderUid);
    if (!b || r.macroScore! > b.macroScore!) best.set(r.uploaderUid, r);
  }
  const rows: LeaderboardRow[] = [];
  for (const r of best.values()) {
    const getTask = (identifier: string) => {
      const id = taskId.get(identifier);
      return id ? r.tasks?.[id] : undefined;
    };
    const v = pick(r, getTask);
    const model = r.editable?.name?.trim();
    if (!model || v === undefined || !Number.isFinite(v)) continue;
    const url = r.editable?.url?.trim();
    const metrics = metricsFn?.(r, getTask);
    rows.push({
      model,
      verified: true,
      link: url && /^https?:\/\//.test(url) ? url : undefined,
      score: Number((v * 100).toFixed(2)),
      date: new Date(r.createdOn).toISOString().slice(0, 10),
      ...(metrics && Object.keys(metrics).length ? { metrics } : {}),
    });
  }
  return rows;
}

const SUPERGLUE_PARTS = [
  ['boolq', 'BoolQ'],
  ['cb', 'CB'],
  ['copa', 'COPA'],
  ['multirc', 'MultiRC'],
  ['record', 'ReCoRD'],
  ['rte', 'RTE'],
  ['wic', 'WiC'],
  ['wsc', 'WSC'],
] as const;

const board: Leaderboard = {
  verified: 'approved for publication by SuperGLUE administrators',
  benchmark: 'superglue',
  parts: {
    boolq: { name: 'BoolQ', group: 'Task' },
    cb: { name: 'CB', group: 'Task' },
    copa: { name: 'COPA', group: 'Task' },
    multirc: { name: 'MultiRC', group: 'Task' },
    record: { name: 'ReCoRD', group: 'Task' },
    rte: { name: 'RTE', group: 'Task' },
    wic: { name: 'WiC', group: 'Task' },
    wsc: { name: 'WSC', group: 'Task' },
  },
  stats: {
    axb: { name: 'AX-b diagnostics (MCC)', unit: 'score', better: 'higher' },
    axg: { name: 'AX-g diagnostics', unit: '%', better: 'higher' },
    microScore: { name: 'Micro average', unit: '%', better: 'higher' },
  },
  url: SUPERGLUE_PAGE,
  feed: `${SUPERGLUE_FEED}, macroScore`,
  terms: SUPERGLUE_TERMS,
  aliases: SUPERGLUE_ALIASES,
  fetch: () => superglueRows(
    (r) => r.macroScore,
    (r, task) => {
      const m: Record<string, number> = {};
      for (const [key, idf] of SUPERGLUE_PARTS) {
        const s = task(idf)?.score;
        if (typeof s === 'number' && Number.isFinite(s)) m[key] = Number((s * 100).toFixed(2));
      }
      const axb = task('AX-b')?.score;
      if (typeof axb === 'number' && Number.isFinite(axb)) m.axb = Number((axb * 100).toFixed(2));
      const axg = task('AX-g')?.score;
      if (typeof axg === 'number' && Number.isFinite(axg)) m.axg = Number((axg * 100).toFixed(2));
      if (typeof r.microScore === 'number' && Number.isFinite(r.microScore)) {
        m.microScore = Number((r.microScore * 100).toFixed(2));
      }
      return m;
    },
  ),
};
export default board;
