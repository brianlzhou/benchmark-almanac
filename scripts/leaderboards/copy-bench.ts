// Copy Bench (21st Labs): models rebuild 50 moving web components from screen recordings.
// Headline score is the two-judge (GPT and Claude) mean self-verified score (0 to 100), matching JSON-LD.
// Live page draws a log-scale "Score vs cost" Pareto frontier scatter chart across all 16 models.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://21st.dev/benchmarks/copy';

interface CopyBenchEntry {
  id?: string;
  name: string;
  open?: boolean;
  license?: string;
  agent?: string;
  effort?: string;
  gpt: [number, number];
  claude: [number, number];
  cost?: number;
  costFirst?: number;
  costFix?: number;
  minutes?: number;
  minutesFirst?: number;
  minutesFix?: number;
  timeouts?: number;
  noFile?: number;
  copied?: number;
  byCategory?: Record<string, { first: number; fix: number }>;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

function extractBalancedArray(src: string, anchorIdx: number): string {
  const start = src.lastIndexOf('[{', anchorIdx);
  if (start === -1) throw new Error('Copy Bench: could not locate model array start');
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('Copy Bench: unbalanced model array in chunk');
}

const board: Leaderboard = {
  benchmark: 'copy-bench',
  url: PAGE,
  feed: PAGE,
  terms: 'Public leaderboard at 21st.dev/benchmarks/copy (MIT-licensed benchmark repo, robots.txt allows /benchmarks/copy).',
  harnesses: 'system',
  chart: {
    title: 'Score vs cost',
    x: { key: 'cost', label: 'Cost per copy', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Self-verified score', better: 'higher' },
    note: 'Two-judge mean self-verified score out of 100 against average USD cost per copy across 50 tasks.',
  },
  parts: {
    pages: { name: 'Pages', group: 'Category' },
    anim2d: { name: '2D animation', group: 'Category' },
    games: { name: 'Games', group: 'Category' },
    shaders: { name: 'Shaders', group: 'Category' },
    scene3d: { name: '3D', group: 'Category' },
  },
  stats: {
    oneShot: { name: 'One-shot score', unit: 'score', better: 'higher' },
    gptJudge: { name: 'GPT judge (self-verified)', unit: 'score', better: 'higher' },
    claudeJudge: { name: 'Claude judge (self-verified)', unit: 'score', better: 'higher' },
    minutes: { name: 'Time per copy', unit: 'minutes', better: 'lower' },
    costFirst: { name: 'One-shot cost', unit: 'usd', better: 'lower' },
    costFix: { name: 'Self-verify cost', unit: 'usd', better: 'lower' },
    minutesFirst: { name: 'One-shot time', unit: 'minutes', better: 'lower' },
    minutesFix: { name: 'Self-verify time', unit: 'minutes', better: 'lower' },
    timeouts: { name: 'Timeouts', unit: 'count', better: 'lower' },
    noFile: { name: 'Missing output files', unit: 'count', better: 'lower' },
    copied: { name: 'Copied reference files', unit: 'count', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`Copy Bench page: ${res.status}`);
    const html = await res.text();
    const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"'\s]+\.js/g)].map((m) => m[0]))];
    let entries: CopyBenchEntry[] | null = null;
    for (const chunkPath of chunks) {
      const cRes = await fetch(`https://21st.dev${chunkPath}`, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
      if (!cRes.ok) continue;
      const js = await cRes.text();
      const idx = js.indexOf('"byCategory"');
      if (idx === -1 || !js.includes('"minutesFix"')) continue;
      const parsed = JSON.parse(extractBalancedArray(js, idx)) as CopyBenchEntry[];
      if (Array.isArray(parsed) && parsed.length >= 5 && parsed[0]?.gpt && parsed[0]?.claude) {
        entries = parsed;
        break;
      }
    }
    if (!entries) throw new Error('Copy Bench: model data chunk not found');

    const rows: LeaderboardRow[] = [];
    for (const e of entries) {
      const selfVerified = r1((e.gpt[1] + e.claude[1]) / 2);
      const oneShot = r1((e.gpt[0] + e.claude[0]) / 2);
      const metrics: Record<string, number> = {
        oneShot,
        gptJudge: r2(e.gpt[1]),
        claudeJudge: r2(e.claude[1]),
      };
      if (e.byCategory) {
        if (typeof e.byCategory.pages?.fix === 'number') metrics.pages = e.byCategory.pages.fix;
        if (typeof e.byCategory['2d']?.fix === 'number') metrics.anim2d = e.byCategory['2d'].fix;
        if (typeof e.byCategory.games?.fix === 'number') metrics.games = e.byCategory.games.fix;
        if (typeof e.byCategory.shaders?.fix === 'number') metrics.shaders = e.byCategory.shaders.fix;
        if (typeof e.byCategory['3d']?.fix === 'number') metrics.scene3d = e.byCategory['3d'].fix;
      }
      if (typeof e.minutes === 'number') metrics.minutes = e.minutes;
      if (typeof e.costFirst === 'number') metrics.costFirst = e.costFirst;
      if (typeof e.costFix === 'number') metrics.costFix = e.costFix;
      if (typeof e.minutesFirst === 'number') metrics.minutesFirst = e.minutesFirst;
      if (typeof e.minutesFix === 'number') metrics.minutesFix = e.minutesFix;
      if (typeof e.timeouts === 'number') metrics.timeouts = e.timeouts;
      if (typeof e.noFile === 'number') metrics.noFile = e.noFile;
      if (typeof e.copied === 'number') metrics.copied = e.copied;

      const row: LeaderboardRow = {
        model: e.name,
        score: selfVerified,
        metrics,
      };
      if (e.agent) row.harness = e.agent;
      if (e.effort && e.effort !== 'default') row.setting = e.effort;
      if (typeof e.cost === 'number') row.cost = e.cost;
      if (typeof e.open === 'boolean') row.open = e.open;
      // Only attach actual license identifiers (skip prose notes on closed models).
      if (e.open && e.license && !/hosted/i.test(e.license)) row.license = e.license;
      rows.push(row);
    }
    return rows;
  },
};

export default board;
