// ReLE (Chinese LLM Benchmark, formerly CLiB) overall leaderboard from leaderboard/alldata.md.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/jeinlee1991/chinese-llm-benchmark/main/leaderboard/alldata.md';
const URL = 'https://github.com/jeinlee1991/chinese-llm-benchmark/blob/main/leaderboard/alldata.md';

function parsePct(raw: string): number | undefined {
  const m = raw.trim().match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

const board: Leaderboard = {
  benchmark: 'rele-chinese-llm-benchmark',
  url: URL,
  feed: FEED,
  terms: 'The ReLE benchmark team publishes leaderboard markdown tables publicly in its open-source GitHub repository.',
  headline: 'Overall ReLE score across eight Chinese and general capability domains.',
  parts: {
    education: 'Education',
    medicineMentalHealth: 'Medicine and mental health',
    finance: 'Finance',
    lawPublicAdmin: 'Law and public administration',
    reasoningMath: 'Reasoning and math',
    languageInstruction: 'Language and instruction following',
    agentToolUse: 'Agents and tool use',
    coding: 'Coding',
  },
  stats: {
    outputPriceCny: {
      name: 'Output price',
      unit: 'cny',
      better: 'lower',
      note: 'Reported API output price per million tokens in Chinese yuan.',
    },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const md = await fetchText(FEED);
    const lines = md.split(/\r?\n/).filter((l) => l.trim().startsWith('|'));

    const rows: LeaderboardRow[] = [];
    for (const line of lines) {
      const cells = line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());

      if (cells.length < 14) continue;
      if (!/^\d+$/.test(cells[0])) continue;

      const model = cells[1].replace(/\(new\)$/i, '').trim();
      const score = parsePct(cells[4]);
      if (!model || score === undefined) continue;

      const metrics: Record<string, number> = {};
      const price = parsePct(cells[3]);
      if (price !== undefined && price > 0) metrics.outputPriceCny = price;

      const partCols: readonly [key: string, idx: number][] = [
        ['education', 6],
        ['medicineMentalHealth', 7],
        ['finance', 8],
        ['lawPublicAdmin', 9],
        ['reasoningMath', 10],
        ['languageInstruction', 11],
        ['agentToolUse', 12],
        ['coding', 13],
      ];

      for (const [key, idx] of partCols) {
        const val = parsePct(cells[idx] ?? '');
        if (val !== undefined) metrics[key] = val;
      }

      rows.push({
        model,
        score,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }

    if (rows.length < 50) {
      throw new Error(`Expected at least 50 rows on ReLE alldata.md, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
