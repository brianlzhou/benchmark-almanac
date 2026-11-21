import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { tables } from '../lib/html.ts';
const URL = 'https://arxiv.org/html/2508.18106';
const board: Leaderboard = {
  benchmark: 'ase-aicgseceval', static: 'paper', url: URL, feed: URL + ' (overall weighted score)', terms: PAPER_TERMS,
  parts: {
    security: { name: 'Security', group: 'Dimension' },
    quality: { name: 'Quality', group: 'Dimension' },
    stability: { name: 'Stability', group: 'Dimension' },
  },
  aliases: {"Qwen3-235B-A22B-Instruct-2507": "qwen3-235b-a22b-instruct-jul-2025", "Kimi-K2-20250711-Preview": "kimi-k2-jul-2025", "Codex-mini-latest": "codex-mini-2025-05-16"},
  async fetch() {
    const html = await paperHtml(URL);
    const t = inlinePaperTables(html).find(t => t[0]?.[4] === 'Overall' && t[0]?.[5] === 'Security');
    const raw = tables(html).find(t => t[0]?.[4]?.text === 'Overall');
    if (!t || t.length < 4) throw new Error('A.S.E result table missing');
    return t.slice(1).map(r => ({model: r[1].replace('-Thinking', ''), score: Number(r[4]), open: r[2] === 'Open Source',
      trials: 3,
      setting: /logo_slow/.test(raw?.find(x => x[1]?.text === r[1])?.[3]?.html ?? '') ? 'slow thinking' : 'fast thinking',
      metrics: {security: Number(r[5]), quality: Number(r[6]), stability: Number(r[7])}}));
  },
};
export default board;
