// RoboMME-Plus (University of Michigan and Stanford University): 800 held-out manipulation episodes (16 tasks x 50).
// Reads https://robomme.github.io/data/plus.json across all 16 evaluated policy and agentic adaptation methods.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://robomme.github.io/leaderboard.html?benchmark=plus';
const FEED = 'https://robomme.github.io/data/plus.json';

interface PlusMethod {
  id: string;
  name: string;
  setting?: string;
  results: Record<string, number>;
  tags?: string[];
  total_size?: string;
  training_rollout_limit?: number;
  released_demonstrations_used?: boolean;
  audit_status?: string;
  link?: string;
  api_cost?: { total_usd?: number | null; display_usd?: number | null };
  evaluation?: { latest_episode_finished_utc?: string };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

const parseParamsB = (raw?: string): number | undefined => {
  if (!raw) return undefined;
  const m = raw.match(/(\d+(?:\.\d+)?)\s*([BM])/i);
  if (!m) return undefined;
  const val = Number(m[1]);
  return m[2].toUpperCase() === 'M' ? Math.round((val / 1000) * 1000) / 1000 : val;
};

const SUITES: Record<string, string[]> = {
  counting: ['BinFill', 'PickXtimes', 'SwingXtimes', 'StopCube'],
  permanence: ['VideoUnmask', 'VideoUnmaskSwap', 'ButtonUnmask', 'ButtonUnmaskSwap'],
  reference: ['PickHighlight', 'VideoRepick', 'VideoPlaceButton', 'VideoPlaceOrder'],
  imitation: ['MoveCube', 'InsertPeg', 'PatternLock', 'RouteStick'],
};

function buildSetting(m: PlusMethod): string | undefined {
  const base = m.setting?.trim();
  if (m.id.includes('-demos-interaction-')) {
    return `${base ?? 'FS'}, hybrid, r${m.training_rollout_limit ?? 0}`;
  }
  if (m.id.includes('-demos-')) {
    return `${base ?? 'FS'}, demo-only, r${m.training_rollout_limit ?? 0}`;
  }
  if (m.id.includes('-interaction-')) {
    return `${base ?? 'FS'}, interaction-only, r${m.training_rollout_limit ?? 0}`;
  }
  return base || undefined;
}

const board: Leaderboard = {
  benchmark: 'robomme-plus',
  url: PAGE,
  feed: FEED,
  terms: 'Public JSON leaderboard published on GitHub Pages by the RoboMME-Plus authors.',
  verified: 'passed RoboMME-Plus development audit',
  costPer: 'run',
  parts: {
    counting: { name: 'Counting', group: 'Suite' },
    permanence: { name: 'Permanence', group: 'Suite' },
    reference: { name: 'Reference', group: 'Suite' },
    imitation: { name: 'Imitation', group: 'Suite' },
    BinFill: { name: 'BinFill', group: 'Task' },
    PickXtimes: { name: 'PickXtimes', group: 'Task' },
    SwingXtimes: { name: 'SwingXtimes', group: 'Task' },
    StopCube: { name: 'StopCube', group: 'Task' },
    VideoUnmask: { name: 'VideoUnmask', group: 'Task' },
    VideoUnmaskSwap: { name: 'VideoUnmaskSwap', group: 'Task' },
    ButtonUnmask: { name: 'ButtonUnmask', group: 'Task' },
    ButtonUnmaskSwap: { name: 'ButtonUnmaskSwap', group: 'Task' },
    PickHighlight: { name: 'PickHighlight', group: 'Task' },
    VideoRepick: { name: 'VideoRepick', group: 'Task' },
    VideoPlaceButton: { name: 'VideoPlaceButton', group: 'Task' },
    VideoPlaceOrder: { name: 'VideoPlaceOrder', group: 'Task' },
    MoveCube: { name: 'MoveCube', group: 'Task' },
    InsertPeg: { name: 'InsertPeg', group: 'Task' },
    PatternLock: { name: 'PatternLock', group: 'Task' },
    RouteStick: { name: 'RouteStick', group: 'Task' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`RoboMME-Plus plus.json: ${res.status}`);
    const data = (await res.json()) as { methods: PlusMethod[] };

    const rows: LeaderboardRow[] = [];
    for (const m of data.methods ?? []) {
      const taskVals = Object.values(m.results ?? {}).filter((v) => typeof v === 'number' && Number.isFinite(v));
      if (!m.name || taskVals.length === 0) continue;

      const avg = r2((taskVals.reduce((a, b) => a + b, 0) / taskVals.length) * 100);
      const metrics: Record<string, number> = {};
      for (const [suiteKey, taskList] of Object.entries(SUITES)) {
        const vals = taskList.map((t) => m.results[t]).filter((v) => typeof v === 'number' && Number.isFinite(v));
        if (vals.length > 0) {
          metrics[suiteKey] = r2((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
        }
        for (const t of taskList) {
          if (typeof m.results[t] === 'number' && Number.isFinite(m.results[t])) {
            metrics[t] = r2(m.results[t] * 100);
          }
        }
      }

      const row: LeaderboardRow = {
        model: m.name,
        score: avg,
        metrics,
      };
      const setting = buildSetting(m);
      if (setting) row.setting = setting;
      const params = parseParamsB(m.total_size);
      if (params !== undefined) row.params = params;
      if (m.tags?.includes('open_sourced_model')) row.open = true;
      else if (m.tags?.includes('proprietary_model')) row.open = false;
      if (m.audit_status === 'passed') row.verified = true;
      const cost = m.api_cost?.total_usd ?? m.api_cost?.display_usd;
      if (typeof cost === 'number' && Number.isFinite(cost) && cost > 0) row.cost = cost;
      const dt = m.evaluation?.latest_episode_finished_utc;
      if (typeof dt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dt)) row.date = dt.slice(0, 10);
      if (m.link && /^https?:\/\//.test(m.link)) row.link = m.link;
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('RoboMME-Plus: parsed zero rows');
    return rows;
  },
};

export default board;
