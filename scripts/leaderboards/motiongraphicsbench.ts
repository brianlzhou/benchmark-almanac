// MotionGraphicsBench (Figma and Stanford University): programmatic verification of 100 SVG motion-graphics tasks.
// Reads Appendix Table 14 (Pass@1 [95% CI] across 47 model/effort configurations) and Table 15 (Pass@32 [95% CI])
// from the official arXiv HTML paper (arXiv:2611.10592).
// Source verbatim CI column header: "Pass@1 [95% CI]" (paired 95% confidence intervals wired to row.low / row.high).
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://arxiv.org/abs/2611.10592';
const FEED = 'https://arxiv.org/html/2611.10592';

const cleanText = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function splitConfig(raw: string): { model: string; setting?: string } {
  const m = raw.match(/^(.+?)\s+\(([^()]+)\)$/);
  if (!m) return { model: raw.trim() };
  return { model: m[1].trim(), setting: m[2].trim() };
}

function parseScoreCi(cell: string): { score: number; low?: number; high?: number } | null {
  const m = cell.match(/^(\d+(?:\.\d+)?)\s*\[\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\]$/);
  if (m) return { score: Number(m[1]), low: Number(m[2]), high: Number(m[3]) };
  const n = Number(cell);
  return Number.isFinite(n) ? { score: n } : null;
}

function parseTwoColTable(tableHtml: string): Array<{ config: string; score: number; low?: number; high?: number }> {
  const out: Array<{ config: string; score: number; low?: number; high?: number }> = [];
  for (const tr of tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => cleanText(c[1]));
    if (cells.length < 2) continue;
    for (let offset = 0; offset + 1 < cells.length; offset += 2) {
      const cfg = cells[offset];
      const val = cells[offset + 1];
      if (!cfg || /^configuration$/i.test(cfg)) continue;
      const parsed = parseScoreCi(val);
      if (parsed) out.push({ config: cfg, ...parsed });
    }
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'motiongraphicsbench',
  url: PAGE,
  feed: FEED,
  terms: 'Public arXiv HTML paper (arXiv:2611.10592) published by Figma and Stanford University.',
  static: 'paper',
  stats: {
    passAt32: {
      name: 'pass@32',
      unit: '%',
      better: 'higher',
      note: 'Probability of at least one verified animation across 32 sampled attempts.',
    },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await paperHtml(FEED);
    const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);

    const pass1Table = tables.find((t) => /Configuration[\s\S]{0,200}Pass@1\s*\[95%\s*CI\]/i.test(cleanText(t)));
    const pass32Table = tables.find((t) => /Configuration[\s\S]{0,200}Pass@32\s*\[95%\s*CI\]/i.test(cleanText(t)));
    if (!pass1Table) throw new Error('MotionGraphicsBench: Pass@1 [95% CI] table not found');

    const p32Map = new Map<string, number>();
    if (pass32Table) {
      for (const e of parseTwoColTable(pass32Table)) {
        p32Map.set(e.config, e.score);
      }
    }

    const rows: LeaderboardRow[] = [];
    for (const e of parseTwoColTable(pass1Table)) {
      const { model, setting } = splitConfig(e.config);
      const row: LeaderboardRow = {
        model,
        score: e.score,
      };
      if (setting && setting !== 'default') row.setting = setting;
      if (typeof e.low === 'number' && typeof e.high === 'number') {
        row.low = e.low;
        row.high = e.high;
      }
      const p32 = p32Map.get(e.config);
      if (typeof p32 === 'number') {
        row.metrics = { passAt32: p32 };
      }
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('MotionGraphicsBench: parsed zero rows');
    return rows;
  },
};

export default board;
