// CoreCodeBench results from the ACL Anthology camera-ready paper (2026.acl-long.1196, Tables 11 and 12).
// Both tables report AC@1 and Rate (%) with 95% confidence interval half-widths ("± CI") for 12 models.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const URL = 'https://aclanthology.org/2026.acl-long.1196/';
const FEED = 'https://aclanthology.org/2026.acl-long.1196.pdf';

const pct = { unit: '%' as const, better: 'higher' as const };

const PARTS: Record<string, BoardPart> = {
  AtomicOverallAC: { name: 'Atomic overall accuracy', ...pct },
  AtomicOverallRate: { name: 'Atomic overall pass rate', ...pct },
  AtomicDevelopmentAC: { name: 'Atomic development accuracy', ...pct },
  AtomicDevelopmentRate: { name: 'Atomic development pass rate', ...pct },
  AtomicBugFixAC: { name: 'Atomic bug-fix accuracy', ...pct },
  AtomicBugFixRate: { name: 'Atomic bug-fix pass rate', ...pct },
  AtomicTDDAC: { name: 'Atomic test-driven development accuracy', ...pct },
  AtomicTDDRate: { name: 'Atomic test-driven development pass rate', ...pct },
  CompositeOverallAC: { name: 'Composite overall accuracy', ...pct },
  CompositeOverallRate: { name: 'Composite overall pass rate', ...pct },
  CompositeDevelopmentAC: { name: 'Composite development accuracy', ...pct },
  CompositeDevelopmentRate: { name: 'Composite development pass rate', ...pct },
  CompositeBugFixAC: { name: 'Composite bug-fix accuracy', ...pct },
  CompositeBugFixRate: { name: 'Composite bug-fix pass rate', ...pct },
  CompositeTDDAC: { name: 'Composite test-driven development accuracy', ...pct },
  CompositeTDDRate: { name: 'Composite test-driven development pass rate', ...pct },
};

const COLS = [
  'OverallAC',
  'OverallRate',
  'DevelopmentAC',
  'DevelopmentRate',
  'BugFixAC',
  'BugFixRate',
  'TDDAC',
  'TDDRate',
] as const;

function parseSection(section: string, prefix: 'Atomic' | 'Composite'): Map<string, Record<string, number>> {
  const out = new Map<string, Record<string, number>>();
  for (const rawLine of section.split(/\r?\n/)) {
    const pairs = [...rawLine.matchAll(/(\d+\.\d+)\s*±\s*(\d+\.\d+)/g)];
    if (pairs.length !== 8) continue;
    const firstIdx = pairs[0].index ?? 0;
    const lead = rawLine
      .slice(0, firstIdx)
      .replace(/^\s*(?:API|Open-Source)\s+/i, '')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim();
    if (!lead) continue;
    const metrics: Record<string, number> = {};
    COLS.forEach((col, i) => {
      metrics[`${prefix}${col}`] = Number(pairs[i][1]);
      metrics[`${prefix}${col}Ci95`] = Number(pairs[i][2]);
    });
    out.set(lead, metrics);
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'corecodebench',
  static: 'paper',
  url: URL,
  feed: FEED,
  terms: `Paper and license at ${URL}`,
  headline: 'Mean of Atomic Overall AC@1 and Composite Overall AC@1 from ACL Anthology Tables 11 and 12.',
  aliases: {
    'Seed-1.6': 'doubao-seed-1-6',
    'Qwen3-Max-Instruct': 'qwen3-max',
    'Qwen3-Coder-480B-A3B-Instruct': 'qwen3-coder-480b-a35b',
    'Claude-4.5-Opus': 'claude-opus-4-5',
    'Kimi-K2': 'kimi-k2-sep-2025',
  },
  parts: PARTS,
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const t11 = text.indexOf('Table 11:');
    const t12 = text.indexOf('Table 12:');
    const end = text.indexOf('Table 13:', t12);
    if (t11 < 0 || t12 < 0) throw new Error('CoreCodeBench Tables 11 and 12 missing from ACL PDF');

    const atomic = parseSection(text.slice(t11, t12), 'Atomic');
    const composite = parseSection(text.slice(t12, end > t12 ? end : t12 + 6000), 'Composite');
    const rows: LeaderboardRow[] = [];

    for (const [model, aMetrics] of atomic) {
      const cMetrics = composite.get(model);
      if (!cMetrics) continue;
      const score = Number(((aMetrics.AtomicOverallAC + cMetrics.CompositeOverallAC) / 2).toFixed(2));
      rows.push({
        model,
        score,
        metrics: { ...aMetrics, ...cMetrics },
      });
    }

    if (rows.length < 12) {
      throw new Error(`Expected 12 rows from CoreCodeBench ACL Tables 11-12, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
