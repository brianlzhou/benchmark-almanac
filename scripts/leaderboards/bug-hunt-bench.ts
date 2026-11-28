// Bug Hunt Bench (Pawel Huryn / Product Compass): evaluates frontier and open coding models on
// finding and fixing 105 real planted bugs across two production repositories (45 in a TypeScript
// VS Code extension, 60 in a React/Supabase LMS), graded blind. Reads live data/benchmark.json,
// keeping the newest non-superseded run per (model, effort, harness) tier just as main.js does.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://bughunt.productcompass.pm';
const FEED = `${SITE}/data/benchmark.json`;

interface BugHuntRun {
  model: string;
  harness?: string;
  effort?: string;
  date?: string;
  n_runs?: number;
  fixed: number;
  repo1_fixed?: number | null;
  repo2_fixed?: number | null;
  partial?: number | null;
  claimed_only?: number | null;
  extras?: number | null;
  false_positive_fixes?: number | null;
  wall_min?: number | null;
  cost_usd?: number | null;
  turns?: number | null;
  superseded?: string | null;
}

interface BugHuntFeed {
  runs: BugHuntRun[];
}

function normalizeHarness(raw: string | undefined): { harness?: string; route?: string } {
  if (!raw) return {};
  const parts = raw.split(/\s+\/\s+/);
  const base = parts[0].trim();
  const route = parts.length > 1 ? parts.slice(1).join(', ').trim() : undefined;
  let harness = base;
  if (/^Antigravity CLI$/i.test(base)) harness = 'Antigravity';
  else if (/^Grok Build CLI/i.test(base)) harness = 'grok-build';
  else if (/^Gemini CLI/i.test(base)) harness = 'Gemini CLI';
  else if (/^DeepSeek Harness$/i.test(base)) harness = 'DeepSeek harness';
  return { harness, route };
}

const board: Leaderboard = {
  benchmark: 'bug-hunt-bench',
  url: SITE,
  feed: FEED,
  terms: 'Public benchmark website and JSON feed published by Pawel Huryn (Product Compass).',
  harnesses: 'system',
  costPer: 'run',
  chart: {
    title: 'Bugs fixed versus run cost',
    x: { key: 'cost', label: 'Total run cost', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Planted bugs fixed (of 105)', unit: 'score', better: 'higher' },
    note: 'Matches the default log-scale cost versus fixed-bugs scatter map on bughunt.productcompass.pm.',
  },
  parts: {
    repo1Fixed: { name: 'VS Code Extension (of 45)', unit: 'score', better: 'higher' },
    repo2Fixed: { name: 'React and Supabase LMS (of 60)', unit: 'score', better: 'higher' },
  },
  stats: {
    partial: { name: 'Partial fixes', unit: 'count', better: 'higher', note: 'Planted bugs addressed partially but not fully closed.' },
    claimedOnly: { name: 'Claimed only', unit: 'count', better: 'lower', note: 'Planted bugs named in the report but not fixed in the diff.' },
    extras: { name: 'Extra fixes', unit: 'count', better: 'higher', note: 'Real non-planted defects found and fixed outside the 105-bug key.' },
    wallMinutes: { name: 'Wall time', unit: 'minutes', better: 'lower', note: 'Active agent runtime across both repositories in minutes.' },
    turns: { name: 'Turns', unit: 'count', better: 'lower', note: 'Total agent turns across both repositories.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = JSON.parse(await fetchText(FEED)) as BugHuntFeed;
    const active = (data.runs ?? []).filter((r) => !r.superseded && r.model && Number.isFinite(r.fixed));
    // Match main.js newestPerTier(): keep latest dated run per (model, effort, harness).
    const newest = new Map<string, BugHuntRun>();
    for (const r of active) {
      const k = `${r.model}|${r.effort ?? ''}|${r.harness ?? ''}`;
      const cur = newest.get(k);
      if (!cur || String(r.date ?? '') > String(cur.date ?? '')) newest.set(k, r);
    }

    const rows: LeaderboardRow[] = [];
    for (const r of newest.values()) {
      const { harness, route } = normalizeHarness(r.harness);
      const settingBits = [r.effort?.trim(), route].filter(Boolean);
      const setting = settingBits.length ? settingBits.join(', ') : undefined;
      const date = r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : undefined;

      const metrics: Record<string, number> = {};
      if (typeof r.repo1_fixed === 'number' && Number.isFinite(r.repo1_fixed)) metrics.repo1Fixed = r.repo1_fixed;
      if (typeof r.repo2_fixed === 'number' && Number.isFinite(r.repo2_fixed)) metrics.repo2Fixed = r.repo2_fixed;
      if (typeof r.partial === 'number' && Number.isFinite(r.partial)) metrics.partial = r.partial;
      if (typeof r.claimed_only === 'number' && Number.isFinite(r.claimed_only)) metrics.claimedOnly = r.claimed_only;
      if (typeof r.extras === 'number' && Number.isFinite(r.extras)) metrics.extras = r.extras;
      if (typeof r.wall_min === 'number' && Number.isFinite(r.wall_min) && r.wall_min > 0) metrics.wallMinutes = r.wall_min;
      if (typeof r.turns === 'number' && Number.isFinite(r.turns) && r.turns > 0) metrics.turns = r.turns;

      rows.push({
        model: r.model.trim(),
        score: r.fixed,
        ...(setting ? { setting } : {}),
        ...(harness ? { harness } : {}),
        ...(date ? { date } : {}),
        ...(typeof r.n_runs === 'number' && Number.isFinite(r.n_runs) && r.n_runs >= 1 ? { trials: r.n_runs } : {}),
        ...(typeof r.cost_usd === 'number' && Number.isFinite(r.cost_usd) && r.cost_usd > 0 ? { cost: r.cost_usd } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
