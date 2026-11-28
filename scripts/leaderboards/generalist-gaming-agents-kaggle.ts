// Generalist Gaming Agents (GARC, Kaggle, and Princeton University):
// 32 real-time browser games played sequentially for 10 minutes each with persistent memory.
// Reads https://generalistgaming.org/data/results.json (25 LLMs and decision models across low/medium/high reasoning).
// Live page draws a "Score vs. cost" scatter chart (#costWrap) plotting mean score (0 to 1) against USD cost per game.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://generalistgaming.org/';
const FEED = 'https://generalistgaming.org/data/results.json';

interface GgaRun {
  reasoning?: string;
  score: number;
  costPerGame?: number;
}

interface GgaModel {
  name: string;
  lab?: string;
  type?: string;
  runs: GgaRun[];
}

interface GgaResults {
  placeholder?: boolean;
  updated?: string;
  models: GgaModel[];
}

const r4 = (n: number) => Math.round(n * 10000) / 10000;

const board: Leaderboard = {
  benchmark: 'generalist-gaming-agents-kaggle',
  url: PAGE,
  feed: FEED,
  terms: 'Public initial-release benchmark JSON published at generalistgaming.org/data/results.json.',
  reference: ['Prime Agent'],
  aliases: {
    'Mistral Large 4.0': 'mistral-large-4',
    'Inkling 2 Small': 'inkling-2-small',
  },
  chart: {
    title: 'Score vs. cost',
    x: { key: 'cost', label: 'Average cost per game', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Mean score', better: 'higher' },
    note: 'Mean normalized score across 32 browser games (0 to 1) against average US dollar cost per game.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`Generalist Gaming Agents results.json: ${res.status}`);
    const data = (await res.json()) as GgaResults;
    if (data.placeholder) throw new Error('Generalist Gaming Agents results.json is marked placeholder');

    const date = typeof data.updated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.updated) ? data.updated : undefined;
    const rows: LeaderboardRow[] = [];

    for (const m of data.models ?? []) {
      if (!m.name || !Array.isArray(m.runs)) continue;
      for (const r of m.runs) {
        if (typeof r.score !== 'number' || !Number.isFinite(r.score)) continue;
        const row: LeaderboardRow = {
          model: m.name,
          score: r4(r.score),
        };
        if (m.type === 'llm') row.harness = 'Prime Agent';
        if (r.reasoning) row.setting = r.reasoning;
        if (typeof r.costPerGame === 'number' && Number.isFinite(r.costPerGame)) {
          row.cost = r4(r.costPerGame);
        }
        if (date) row.date = date;
        rows.push(row);
      }
    }
    if (rows.length === 0) throw new Error('Generalist Gaming Agents: parsed zero rows');
    return rows;
  },
};

export default board;
