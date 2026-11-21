// Overall oracle-normalized score, confidence interval, open weights, and category scores.
// Task tables publish success percentages by difficulty and identify agents by name and type alone.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL = 'https://roger-creus.github.io/agentick/board/';
const board: Leaderboard = {
  benchmark: 'agentick', url: URL, feed: URL,
  terms: 'MIT repository; the project site has no robots.txt.',
  async fetch() {
    const page = await fetchText(URL);
    const cells = (html: string) => tables(html)[0]?.map(row => row.map(cell => cell.text));
    const overall = cells(page.match(/<table\b[^>]*id="table-overall"[\s\S]*?<\/table>/)?.[0] ?? '');
    if (!overall?.[0].includes('95% CI')) throw new Error('Overall table missing');
    const byConfig = new Map<string, LeaderboardRow>();
    const byName = new Map<string, LeaderboardRow[]>();
    const rows = overall.slice(1).filter(c => c[2] !== 'other').map(c => {
      const effort = c[1].match(/ \((high, 1 seed)\)$/);
      const ci = c[6].match(/^([+-]?[\d.]+)(?:&ndash;|–)([+-]?[\d.]+)$/);
      const row: LeaderboardRow = {
        model: effort ? c[1].slice(0, effort.index) : c[1],
        harness: c[4] === '–' ? undefined : c[4],
        setting: [c[3], effort?.[1]].filter(Boolean).join(', '),
        score: num(c[5])!, date: c[8],
        open: c[7] === 'Yes' ? true : c[7] === 'No' ? false : undefined,
        trials: effort ? 1 : undefined,
        low: ci ? Number(ci[1]) : undefined, high: ci ? Number(ci[2]) : undefined,
        metrics: {},
      };
      byConfig.set(JSON.stringify(c.slice(1, 5)), row);
      const name = JSON.stringify(c.slice(1, 3));
      byName.set(name, [...(byName.get(name) ?? []), row]);
      return row;
    });
    board.parts = {};
    for (const m of page.matchAll(/<table\b[^>]*id="table-cat-([\w-]+)"[\s\S]*?<\/table>/g)) {
      const key = m[1].replace(/_(\w)/g, (_, c: string) => c.toUpperCase());
      const name = m[1].replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
      board.parts[key] = { name, group: 'Category' };
      for (const c of cells(m[0])?.slice(1) ?? []) {
        const row = byConfig.get(JSON.stringify(c.slice(1, 5)));
        const score = num(c[5]);
        if (row && score !== undefined) row.metrics![key] = score;
      }
    }
    for (const task of page.matchAll(/<h3 class="task-card-title">([\w-]+)<\/h3>[\s\S]*?(<table\b[\s\S]*?<\/table>)/g)) {
      const t = cells(task[2]);
      if (!t) continue;
      for (const c of t.slice(1)) {
        const matches = byName.get(JSON.stringify(c.slice(0, 2)));
        if (matches?.length !== 1) continue;
        for (const [i, difficulty] of t[0].entries()) {
          if (i < 2 || !c[i]?.endsWith('%')) continue;
          const score = num(c[i]);
          if (score !== undefined) matches[0].metrics![task[1] + ' ' + difficulty] = score;
        }
      }
    }
    if (rows.length < 3 || rows.some(row => !Number.isFinite(row.score))) throw new Error('Invalid overall rows');
    return rows;
  },
};
export default board;
