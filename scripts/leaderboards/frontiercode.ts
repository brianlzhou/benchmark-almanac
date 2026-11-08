// FrontierCode (Cognition). Each version's chart reads a static JSON file on cognition.com:
//   1.0  /data/frontier-code/data.json      (blog post 2026-06-08; subsets diamond 50, main 100, extended 150)
//   1.1  /data/frontier-code-1.1/data.json  (blog post 2026-07-07; wrapped in "v1_1"; subsets main, extended)
//   2.0  /data/frontier-code-2.0/data.json  (blog post 2026-10-27, cognition.com/frontiercode; subset main, 132 tasks)
// data[model][effort][subset].new_score (0 to 1) is the score the page plots and ranks; "correct" is the raw
// pass rate before the shortcut penalty. The page shows each model's best effort; every effort is kept
// here with the effort in `setting`. The "main" subset is read for every version: the 1.0 post calls it
// "the standard 100-task benchmark". With `metrics: true` (1.0 here) each row also keeps the numbers the
// page's chart can plot against score: correct as a percent (`passRate`), duration_min in seconds (`latency`),
// tool_calls (`toolCalls`), steps and ote (output-token equivalent, the post's price-normalized effort scale).
// Versions 1.0 and 1.1 opt in to extended and diamond subset scores as metrics on their main rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

interface Payload {
  models: string[];
  harness?: Record<string, string>;
  efforts?: Record<string, string[]>;
  // cost: mean US dollars per task; tokens: mean output tokens per task
  data: Record<string, Record<string, Record<string, Cell>>>;
}

interface Cell {
  new_score?: number | null;
  cost?: number | null;
  tokens?: number | null;
  correct?: number | null;
  duration_min?: number | null;
  tool_calls?: number | null;
  steps?: number | null;
  ote?: number | null;
}

// the page's own labels for its harness keys
const HARNESS: Record<string, string> = {
  devin: 'Devin',
  'devin-cli': 'Devin CLI',
  'devin-cli-swe1': 'Devin CLI',
  'claude-code': 'Claude Code',
  codex: 'Codex',
  'grok-build': 'Grok Build',
  muse: 'Muse Code',
  'gemini-cli': 'Gemini CLI',
  vibe: 'Mistral Vibe',
  'mini-swe-agent': 'mini-swe-agent',
};

/** The chart numbers of one cell, by metric key; see the header. */
function cellMetrics(c: Cell): Record<string, number> {
  const m: Record<string, number> = {};
  const put = (k: string, v: number | null | undefined, scale = 1) => {
    if (typeof v === 'number' && Number.isFinite(v)) m[k] = v * scale;
  };
  put('passRate', c.correct, 100);
  put('latency', c.duration_min, 60);
  put('toolCalls', c.tool_calls);
  put('steps', c.steps);
  put('ote', c.ote);
  return m;
}

export function makeFrontierCode(opts: { benchmark: string; url: string; path: string; wrapper?: string; metrics?: boolean; subsets?: boolean }): Leaderboard {
  const feed = `https://cognition.com${opts.path}`;
  return {
    benchmark: opts.benchmark,
    url: opts.url,
    feed,
    terms: "Static JSON on cognition.com that the page's chart loads; Cognition's website terms set no rule against automated reading.",
    aliases: { 'Muse Wonder 1.0': 'muse-wonder' },
    async fetch() {
      const raw = await fetchJson<Record<string, unknown>>(feed);
      const p = (opts.wrapper ? raw[opts.wrapper] : raw) as Payload;
      const rows: LeaderboardRow[] = [];
      for (const model of p.models) {
        const byEffort = p.data[model] ?? {};
        for (const effort of p.efforts?.[model] ?? Object.keys(byEffort)) {
          const cell = byEffort[effort]?.main;
          const s = cell?.new_score;
          if (typeof s !== 'number') continue;
          const h = p.harness?.[model];
          const metrics = opts.metrics && cell ? cellMetrics(cell) : {};
          if (opts.subsets) for (const subset of ['extended', 'diamond']) {
            const value = byEffort[effort]?.[subset]?.new_score;
            if (typeof value === 'number' && Number.isFinite(value)) metrics[subset] = value * 100;
          }
          rows.push({
            model,
            score: s * 100,
            setting: effort,
            harness: h ? (HARNESS[h] ?? h) : undefined,
            cost: cell?.cost ?? undefined,
            tokens: cell?.tokens ?? undefined,
            ...(Object.keys(metrics).length ? { metrics } : {}),
          });
        }
      }
      return rows;
    },
  };
}

export default {
  ...makeFrontierCode({
    benchmark: 'frontiercode',
    url: 'https://cognition.com/blog/frontier-code',
    path: '/data/frontier-code/data.json',
    metrics: true,
    subsets: true,
  }),
  chart: {
    title: 'Score against time',
    note: "Each point is one model at one reasoning effort. The post's chart can also put output tokens, cost, tool calls, agent steps or OTE on the x-axis.",
    x: { key: 'latency', label: 'Avg wall-clock time per rollout', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Score', unit: '%', better: 'higher' },
  },
} satisfies Leaderboard;
