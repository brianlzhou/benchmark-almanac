// RedlineBench (Crosby x micro1). A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["contract"], read as data. Its default tab,
// Mean score (0 to 100), is the score. Static HTML tables on the same report page supply side, turn, and rubric
// dimension subscores plus editing behavior metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://www.micro1.ai/benchmark/crosby-micro1-redlinebench';

const cleanName = (s: string) => s.replace(/[\s*†‡]+$/u, '').trim();

const board: Leaderboard = {
  benchmark: 'redlinebench',
  parts: {
    sideA: { name: 'AgentCo (Side A)', group: 'Side' },
    sideB: { name: 'Customer (Side B)', group: 'Side' },
    turn1: { name: 'Turn 1', group: 'Turn' },
    turn2: { name: 'Turn 2', group: 'Turn' },
    turn3: { name: 'Turn 3', group: 'Turn' },
    turn4: { name: 'Turn 4', group: 'Turn' },
    legal: { name: 'Legal', group: 'Dimension' },
    commercial: { name: 'Commercial', group: 'Dimension' },
    negotiation: { name: 'Negotiation', group: 'Dimension' },
    counterparty: { name: 'Counterparty', group: 'Dimension' },
    dealClosing: { name: 'Deal-closing', group: 'Dimension' },
  },
  stats: {
    redlinesPerTask: { name: 'Redlines per task', unit: 'count' },
    editsPerTouched: { name: 'Edits per touched clause', unit: 'count' },
    avgEditLengthChars: { name: 'Average edit length', unit: 'count' },
  },
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "contract", Mean score, and static HTML results tables)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch(): Promise<LeaderboardRow[]> {
    const [rows, html] = await Promise.all([micro1Data(PAGE, 'contract'), fetchText(PAGE)]);
    const all = tables(html);
    const byModel = new Map<string, Record<string, number>>();
    const readTable = (matchHead: (h: string[]) => boolean, cols: [number, string][]) => {
      const t = all.find((tbl) => tbl[0] && matchHead(tbl[0].map((c) => c.text)));
      if (!t) return;
      for (const r of t.slice(1)) {
        const name = cleanName(r[0]?.text ?? '');
        if (!name) continue;
        const rec = byModel.get(name) ?? {};
        for (const [idx, key] of cols) {
          const v = num(r[idx]?.text);
          if (v !== undefined) rec[key] = v;
        }
        if (Object.keys(rec).length) byModel.set(name, rec);
      }
    };
    readTable((h) => h[0] === 'Model' && h.some((x) => x.includes('Side A')), [[1, 'sideA'], [2, 'sideB']]);
    readTable((h) => h[0] === 'Model' && h[1] === 'Turn 1', [[1, 'turn1'], [2, 'turn2'], [3, 'turn3'], [4, 'turn4']]);
    readTable((h) => h[0] === 'Model' && h[1] === 'Legal' && h[2] === 'Commercial', [
      [1, 'legal'], [2, 'commercial'], [3, 'negotiation'], [4, 'counterparty'], [5, 'dealClosing'],
    ]);
    readTable((h) => h[0] === 'Actor' && h.some((x) => x.includes('Redlines')), [
      [1, 'redlinesPerTask'], [2, 'editsPerTouched'], [3, 'avgEditLengthChars'],
    ]);
    return rows.map((row) => {
      const m = byModel.get(row.model);
      return m && Object.keys(m).length ? { ...row, metrics: m } : row;
    });
  },
};
export default board;
