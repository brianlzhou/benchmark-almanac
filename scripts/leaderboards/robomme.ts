// RoboMME (University of Michigan and Stanford University): 16 memory-intensive robotic manipulation tasks across 4 suites.
// Reads the inline `var RESULTS = { ... };` dataset from robomme.github.io/leaderboard.html, filtering out Human and Oracle baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://robomme.github.io/leaderboard.html';

interface RoboMmeModel {
  name: string;
  model_type?: string;
  baseline?: boolean;
  total_size?: string;
  organization?: string;
  tags?: string[];
  api_cost?: { total_usd?: number | null; display_usd?: number | null };
  tasks: Record<string, number>;
}

interface RoboMmeResults {
  task_suites: Record<string, string[]>;
  models: RoboMmeModel[];
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

const board: Leaderboard = {
  benchmark: 'robomme',
  url: PAGE,
  feed: PAGE,
  terms: 'Public leaderboard published on GitHub Pages by the RoboMME authors.',
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
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`RoboMME leaderboard.html: ${res.status}`);
    const html = await res.text();
    const start = html.indexOf('var RESULTS = {');
    if (start === -1) throw new Error('RoboMME: RESULTS object not found');
    const end = html.indexOf('};\n', start);
    if (end === -1) throw new Error('RoboMME: RESULTS end not found');
    const jsonText = html
      .slice(start + 'var RESULTS = '.length, end + 1)
      .replace(/^\s*\/\/.*$/gm, '');
    const data = JSON.parse(jsonText) as RoboMmeResults;

    const rows: LeaderboardRow[] = [];
    for (const m of data.models ?? []) {
      if (!m.name || m.baseline) continue;
      if (/human|oracle/i.test(`${m.name} ${m.model_type ?? ''}`)) continue;
      const taskVals = Object.values(m.tasks ?? {}).filter((v) => typeof v === 'number' && Number.isFinite(v));
      if (taskVals.length === 0) continue;

      const avg = r2((taskVals.reduce((a, b) => a + b, 0) / taskVals.length) * 100);
      const metrics: Record<string, number> = {};
      for (const [suiteKey, taskList] of Object.entries(SUITES)) {
        const vals = taskList.map((t) => m.tasks[t]).filter((v) => typeof v === 'number' && Number.isFinite(v));
        if (vals.length > 0) {
          metrics[suiteKey] = r2((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
        }
        for (const t of taskList) {
          if (typeof m.tasks[t] === 'number' && Number.isFinite(m.tasks[t])) {
            metrics[t] = r2(m.tasks[t] * 100);
          }
        }
      }

      const row: LeaderboardRow = {
        model: m.name,
        score: avg,
        metrics,
      };
      const params = parseParamsB(m.total_size);
      if (params !== undefined) row.params = params;
      if (m.tags?.includes('open_sourced_model')) row.open = true;
      else if (m.tags?.includes('proprietary_model')) row.open = false;
      const cost = m.api_cost?.total_usd ?? m.api_cost?.display_usd;
      if (typeof cost === 'number' && Number.isFinite(cost) && cost > 0) row.cost = cost;
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('RoboMME: parsed zero rows');
    return rows;
  },
};

export default board;
