// Claw-Eval. claw-eval.github.io is a single-page app. Its main script lists the result releases (each with
// an id such as "20260509" and a "latest" flag) and lazy-loads one benchmark-<hash>.js module per release.
// That module exports benchmarkData (general and multi-turn tasks: per model avg_score from 0 to 1, Pass@3,
// Pass^3 and per-task results) and multimodalModels (the multimodal tasks, same fields). The importer finds
// the latest release, loads its module as text and reads each model's top-level numbers as data, never
// running it. claw-eval takes avg_score × 100 (the "Avg" that model cards cite), claw-eval-pass-3.ts takes
// pass_all_3_rate (Pass^3, the board's default sort) and claw-eval-mm.ts takes the multimodal avg_score.
// The release date is the row date. claw-eval rows also carry the table's other columns in `metrics`: Pass^3
// ("pass3") and Pass@3 ("passAt3"), and the score's parts, completion, robustness and safety, all in %.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

export const CLAW_SITE = 'https://claw-eval.github.io/';
export const CLAW_TERMS = 'Static files of the Claw-Eval GitHub Pages site, which states no terms; the claw-eval repository is MIT-licensed.';
export const CLAW_FEED = `${CLAW_SITE}assets/benchmark-<hash>.js (latest release)`;

type Fields = Record<string, number | boolean>;
interface ClawModel {
  name: string;
  fields: Fields;
  tasks: Record<string, Fields>;
}

/** The latest release's models, split into the general board and the multimodal board. */
export async function clawModels(): Promise<{ date: string; general: ClawModel[]; multimodal: ClawModel[] }> {
  const page = await fetchText(CLAW_SITE);
  const main = page.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
  if (!main) throw new Error('main script not found');
  const js = await fetchText(new URL(main, CLAW_SITE).href);
  const latest = js.match(/\{id:"(\d{8})",label:"([\d-]+)",latest:!0\}/);
  if (!latest) throw new Error('latest release not found');
  const chunk = js.match(new RegExp(`${latest[1]}:\\{benchmark:\\(\\)=>\\w+\\(\\(\\)=>import\\("\\./(benchmark-[\\w-]+\\.js)"`))?.[1];
  if (!chunk) throw new Error(`module for release ${latest[1]} not found`);
  const mod = await fetchText(new URL(`assets/${chunk}`, CLAW_SITE).href);
  const exports = mod.match(/export\{([^}]*)\}/)?.[1] ?? '';
  const local = (name: string) => exports.match(new RegExp(`(\\w+) as ${name}\\b`))?.[1];
  const general = local('benchmarkData');
  const multi = local('multimodalModels');
  if (!general || !multi) throw new Error(`unexpected exports: ${exports}`);
  // where each top-level declaration starts, so the models of one export can be told from the other's
  const starts = [...mod.matchAll(/(?:^const |[,;]\s*)([\w$]+)=[{[]/g)].map((m) => ({ name: m[1], at: m.index! }));
  const region = (name: string) => {
    const i = starts.findIndex((s) => s.name === name);
    if (i < 0) throw new Error(`declaration of ${name} not found`);
    return mod.slice(starts[i].at, starts[i + 1]?.at ?? mod.length);
  };
  const fields = (source: string): Fields => Object.fromEntries(
    [...source.matchAll(/(\w+):(-?\d*\.?\d+(?:e-?\d+)?|!0|!1)(?=[,}])/g)].map(m =>
      [m[1], m[2] === '!0' ? true : m[2] === '!1' ? false : Number(m[2])]));
  const read = (src: string): ClawModel[] => {
    const headers = [...src.matchAll(/\{id:"[^"]+",name:"([^"]+)",([\s\S]*?)task_results:\{/g)];
    return headers.map((m, index) => {
      const results = src.slice(m.index! + m[0].length, headers[index + 1]?.index ?? src.length);
      const tasks = [...results.matchAll(/(?:^|,)"?([\w-]+)"?:\{(score:[^{}]*\})/g)];
      return { name: m[1], fields: fields(m[2]),
        tasks: Object.fromEntries(tasks.map(task => [task[1], fields(task[2])])) };
    });
  };
  return { date: latest[2], general: read(region(general)), multimodal: read(region(multi)) };
}

/** The table's other columns for the overall view, in %: Pass^3, Pass@3 and the score's three parts. */
const EXTRAS: [key: string, field: string, scale: number][] = [
  ['pass3', 'pass_all_3_rate', 1],
  ['passAt3', 'pass_at_3_rate', 1],
  ['completion', 'avg_completion', 100],
  ['robustness', 'avg_robustness', 100],
  ['safety', 'avg_safety', 100],
  ['completionStd', 'avg_completion_std', 100],
  ['robustnessStd', 'avg_robustness_std', 100],
  ['safetyStd', 'avg_safety_std', 100],
];

/** One row per model from the named board, scored by `field` times `scale`; `extras` adds the EXTRAS metrics. */
export async function clawRows(board: 'general' | 'multimodal', field: string, scale: number, extras = false, details?: Leaderboard): Promise<LeaderboardRow[]> {
  const data = await clawModels();
  const rows: LeaderboardRow[] = [];
  for (const m of data[board]) {
    const v = m.fields[field];
    if (typeof v !== 'number') continue;
    const metrics: Record<string, number> = {};
    const std = m.fields.avg_score_std;
    if (typeof std === 'number') metrics[field === 'avg_score' ? 'std' : 'avgScoreStd'] = Number((std * 100).toFixed(2));
    if (extras) {
      for (const [k, f, x] of EXTRAS) {
        const e = m.fields[f];
        if (typeof e === 'number') metrics[k] = Number((e * x).toFixed(2));
      }
    }
    if (details) {
      for (const [key, value] of Object.entries(m.fields)) {
        if (typeof value !== 'number') continue;
        if (key === 'tasks_evaluated' || /_n_tasks$/.test(key)) continue;
        if (!(key === 'pass_rate' || /^(general|multi_turn)_/.test(key))) continue;
        const outKey = key.endsWith('_std')
          ? key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
          : key;
        metrics[outKey] = /(?:completion|robustness|safety|score_std)/.test(key) ? value * 100 : value;
      }
      if (field !== 'avg_score' && typeof m.fields.avg_score === 'number') metrics.averageScore = m.fields.avg_score * 100;
    }
    rows.push({ trials: details ? 3 : undefined, model: m.name, score: Number((v * scale).toFixed(2)), date: data.date, ...(Object.keys(metrics).length ? { metrics } : {}) });
  }
  if (!rows.length) throw new Error(`no ${field} values on the ${board} board`);
  return rows;
}

/** Claw-Eval display names the shared resolver cannot place. */
export const CLAW_ALIASES: Record<string, string> = {
  // the board's chart gives this model the id qwen3.5-397b-a17b, the open-weight release
  'Qwen3.5 397A17B': 'qwen3-5-397b-a17b',
};

const board: Leaderboard = {
  benchmark: 'claw-eval',
  parts: {
    general_score: { name: 'General', group: 'Task family' },
    multi_turn_score: { name: 'Multi-turn', group: 'Task family' },
    completion: { name: 'Completion', group: 'Dimension' },
    robustness: { name: 'Robustness', group: 'Dimension' },
    safety: { name: 'Safety', group: 'Dimension' },
  },
  url: CLAW_SITE,
  feed: `${CLAW_FEED} (benchmarkData avg_score)`,
  terms: CLAW_TERMS,
  aliases: CLAW_ALIASES,
  stats: {
    pass3: { name: 'Pass^3', unit: '%', better: 'higher' },
    passAt3: { name: 'Pass@3', unit: '%', better: 'higher' },
    pass_rate: { name: 'Pass rate', unit: '%', better: 'higher' },
    general_pass_at_3: { name: 'General pass@3', unit: '%', better: 'higher' },
    general_pass_all_3: { name: 'General pass^3', unit: '%', better: 'higher' },
    general_completion: { name: 'General completion', unit: '%', better: 'higher' },
    general_robustness: { name: 'General robustness', unit: '%', better: 'higher' },
    general_safety: { name: 'General safety', unit: '%', better: 'higher' },
    multi_turn_pass_at_3: { name: 'Multi-turn pass@3', unit: '%', better: 'higher' },
    multi_turn_pass_all_3: { name: 'Multi-turn pass^3', unit: '%', better: 'higher' },
    multi_turn_completion: { name: 'Multi-turn completion', unit: '%', better: 'higher' },
    multi_turn_robustness: { name: 'Multi-turn robustness', unit: '%', better: 'higher' },
    multi_turn_safety: { name: 'Multi-turn safety', unit: '%', better: 'higher' },
  },
  fetch: () => clawRows('general', 'avg_score', 100, true, board),
};
export default board;
