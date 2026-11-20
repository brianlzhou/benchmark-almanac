// Read FrontierCode scores and costs by model and reasoning effort from the published chart data.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';

interface Payload {
  models: string[];
  subsets?: Record<string, number>;
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
  flagged_rate?: number | null;
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
  put('flaggedRate', c.flagged_rate, 100);
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
    harnesses: 'system',
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
          if (typeof p.subsets?.main === 'number') metrics.tasks = p.subsets.main;
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

