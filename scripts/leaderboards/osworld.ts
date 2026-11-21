// Original OSWorld paper's overall success rate. The live workbook now contains Verified results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2404.07972';
const board: Leaderboard = {
  benchmark: 'osworld', static: 'paper', parts: {
  os: { name: 'OS', group: 'Category' },
  office: { name: 'Office', group: 'Category' },
  daily: { name: 'Daily', group: 'Category' },
  professional: { name: 'Professional', group: 'Category' },
  workflow: { name: 'Workflow', group: 'Category' },
}, url: URL, feed: URL + ' (overall success-rate table)', terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(URL));
    const t = tables.find(t => t[0]?.[0] === 'Inputs' && t[1]?.at(-1) === 'Overall');
    if (!t || t.length !== 29) throw new Error('Original OSWorld table changed');
    const rows: LeaderboardRow[] = t.slice(2, 28).map((r, i) => ({
      model: /^(GPT-3.5|GPT-4V|Gemini-Pro|Gemini-ProV|Gemini-Pro-1.5)$/.test(r[1]) ? `${r[1]} (snapshot unspecified)` : r[1],
      score: Number(r[7].replace('%', '')),
      setting: `${i < 8 ? 'A11y tree' : i < 14 ? 'Screenshot' : i < 20 ? 'Screenshot + A11y tree' : 'Set-of-Mark'}; original 369-task benchmark`,
      metrics: Object.fromEntries(['os', 'office', 'daily', 'professional', 'workflow'].map((k, j) => [k, Number(r[j + 2].replace('%', ''))])),
    }));
    const apps = tables.find(t => t[0]?.[0] === 'Inputs' && t[1]?.includes('Calc'));
    if (apps?.length === t.length) {
      for (const [start, end] of [[2, 10], [10, 16], [16, 22], [22, 28]]) {
        for (let i = start; i < end; i++) {
          const values = apps.slice(start, end).find(r => r[1] === t[i][1]);
          if (!values) continue;
          for (const [j, app] of apps[1].entries()) {
            if (!app || app === 'OS' || app === 'Workflow' || !values[j]?.trim()) continue;
            const n = Number(values[j]);
            if (!Number.isFinite(n)) continue;
            rows[i - 2].metrics![app] = n;
            board.parts![app] = { name: app === 'TB' ? 'Thunderbird' : app === 'VSC' ? 'VS Code' : app, group: 'Application' };
          }
        }
      }
    }
    return checked(rows, 3);
  },
};
export default board;
