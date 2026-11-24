// The source reports no overall score. The headline is the plain mean of the 30 monthly parts, computed by this importer.
// Knowledge Cutoff Benchmark (Apoorv Saxena).
// Probes models on curated real-world events spread across 30 months (2024-01 through 2026-06) using
// low- and medium-predictability events, plus control questions (living people and fake events) to measure
// confabulation. Reads the embedded JSON data payload in docs/index.html from apoorvumang/knowledge-cutoff.
// The explorer ranks models by estimated cutoff month on the direct probe and notes that multiple choice
// over-counts through guessing, so the headline score is the plain unweighted mean of the 30 monthly
// direct-probe accuracies (%), with yearly and monthly accuracies in parts and diagnostics in stats.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/apoorvumang/knowledge-cutoff/main/docs/index.html';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthPoint {
  m: string;
  k: number;
  w: number;
  a: number;
  n: number;
}
interface ProbeSummary {
  curve?: MonthPoint[];
  cutoff?: string | null;
  cutoff_status?: string;
  controls?: { alive_correct?: number; alive_n?: number; fake_confirmed?: number; fake_n?: number };
}
interface Payload {
  months: string[];
  models: string[];
  labels: Record<string, { name: string; advertised?: string }>;
  summary: Record<string, { direct?: ProbeSummary; mcq?: ProbeSummary }>;
}

const SHORT_MO: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function parseMonthIndex(s: string | null | undefined): number | undefined {
  if (!s) return undefined;
  const iso = s.match(/^(\d{4})-(\d{2})/);
  if (iso) return Number(iso[1]) * 12 + Number(iso[2]);
  const text = s.match(/^([A-Z][a-z]{2})\s+(\d{4})$/);
  if (text && SHORT_MO[text[1]]) return Number(text[2]) * 12 + SHORT_MO[text[1]];
  return undefined;
}

function monthKey(m: string): string {
  return `m_${m.replace('-', '_')}`;
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-');
  return `${MONTH_NAMES[Number(mo) - 1]} ${y}`;
}

function plainMeanRate(points: MonthPoint[], field: 'k' | 'w' | 'a'): number | undefined {
  let sum = 0;
  let count = 0;
  for (const p of points) {
    if (!Number.isFinite(p[field]) || !Number.isFinite(p.n) || p.n <= 0) continue;
    sum += p[field];
    count++;
  }
  return count > 0 ? (sum / count) * 100 : undefined;
}

const staticParts: Record<string, BoardPart> = {
  y2024: { name: '2024 events', group: 'Year' },
  y2025: { name: '2025 events', group: 'Year' },
  y2026: { name: '2026 events', group: 'Year' },
};

const board: Leaderboard = {
  benchmark: 'saxena-knowledge-cutoff',
  url: 'https://apoorvumang.github.io/knowledge-cutoff/',
  feed: FEED,
  terms: 'Published under CC BY 4.0 in apoorvumang/knowledge-cutoff. https://github.com/apoorvumang/knowledge-cutoff',
  headline: 'The source reports no overall score. This is the plain unweighted mean of the 30 monthly direct-probe accuracies.',
  aliases: {
    'GPT-5.6 (sol)': 'gpt-5-6-sol',
    'Muse Glimmer 30B': 'muse-glimmer',
    'Tencent Hy4 (preview)': 'tencent-hy4-preview',
    'DeepSeek V4 Flash (0731)': 'deepseek-v4-flash-0731',
    'Qwen3.8 Max': 'qwen-3-8-max',
    'Qwen3.8 27B': 'qwen-3-8-27b',
  },
  parts: staticParts,
  stats: {
    wrongRate: { name: 'Confidently wrong rate', unit: '%', better: 'lower', note: 'Plain mean share of events answered confidently incorrectly across the 30 months on the direct probe.' },
    abstainRate: { name: 'Abstain rate', unit: '%', note: 'Plain mean share of events where the model hedged or abstained across the 30 months on the direct probe.' },
    mcqAccuracy: { name: 'Multiple-choice accuracy', unit: '%', better: 'higher', note: 'Plain mean monthly accuracy on the multiple-choice probe across all 30 months.' },
    aliveControl: { name: 'Living-person control accuracy', unit: '%', better: 'higher', note: 'Accuracy on famous living-person control prompts.' },
    fakeControl: { name: 'Fake-event confabulation rate', unit: '%', better: 'lower', note: 'Share of fabricated control events the model falsely confirmed.' },
    monthsAbove50: { name: 'Months at or above 50% accuracy', unit: 'count', better: 'higher' },
    cutoffGapMonths: { name: 'Advertised minus effective cutoff gap', unit: 'count', note: 'Months by which the measured effective cutoff trails the advertised cutoff date.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const m = html.match(/<script[^>]*id="data"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) throw new Error('Embedded data script missing in knowledge-cutoff docs/index.html');
    const data = JSON.parse(m[1]) as Payload;
    if (!Array.isArray(data.models) || !Array.isArray(data.months) || !data.summary) {
      throw new Error('Unexpected knowledge-cutoff payload schema');
    }

    const parts: Record<string, BoardPart> = { ...staticParts };
    for (const mo of data.months) parts[monthKey(mo)] = { name: monthLabel(mo), group: 'Month' };
    board.parts = parts;

    const rows: LeaderboardRow[] = [];
    for (const id of data.models) {
      const sum = data.summary[id];
      const direct = sum?.direct;
      if (!direct?.curve?.length) continue;
      const validMonths = direct.curve.filter((p) => Number.isFinite(p.k) && Number.isFinite(p.n) && p.n > 0);
      if (validMonths.length !== data.months.length) continue;
      const score = plainMeanRate(validMonths, 'k');
      if (score === undefined) continue;

      const label = data.labels[id];
      const model = label?.name?.trim() || id;
      const metrics: Record<string, number> = {};

      for (const yr of ['2024', '2025', '2026'] as const) {
        const sub = validMonths.filter((p) => p.m.startsWith(`${yr}-`));
        const acc = plainMeanRate(sub, 'k');
        if (acc !== undefined) metrics[`y${yr}`] = acc;
      }
      for (const p of validMonths) {
        metrics[monthKey(p.m)] = p.k * 100;
      }

      const wrong = plainMeanRate(validMonths, 'w');
      const abstain = plainMeanRate(validMonths, 'a');
      if (wrong !== undefined) metrics.wrongRate = wrong;
      if (abstain !== undefined) metrics.abstainRate = abstain;
      metrics.monthsAbove50 = validMonths.filter((p) => p.k >= 0.5).length;

      if (sum?.mcq?.curve?.length) {
        const mcqAcc = plainMeanRate(sum.mcq.curve, 'k');
        if (mcqAcc !== undefined) metrics.mcqAccuracy = mcqAcc;
      }

      const ctl = direct.controls ?? sum?.mcq?.controls;
      if (ctl?.alive_n && ctl.alive_n > 0 && typeof ctl.alive_correct === 'number') {
        metrics.aliveControl = (ctl.alive_correct / ctl.alive_n) * 100;
      }
      if (ctl?.fake_n && ctl.fake_n > 0 && typeof ctl.fake_confirmed === 'number') {
        metrics.fakeControl = (ctl.fake_confirmed / ctl.fake_n) * 100;
      }

      const advIdx = parseMonthIndex(label?.advertised);
      const effIdx = parseMonthIndex(direct.cutoff);
      if (advIdx !== undefined && effIdx !== undefined) {
        metrics.cutoffGapMonths = advIdx - effIdx;
      }

      rows.push({ model, score, setting: 'Direct probe', metrics });
    }
    return checked(rows, 29);
  },
};

export default board;
