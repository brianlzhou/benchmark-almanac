// The multilingual adverse drug event challenge ranks teams by macro F1. The workshop overview gives the official ranking and nine language and dataset scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.smm4h-1.53.pdf";

const board: Leaderboard = {
  benchmark: "smm4h-multilingual-ade-2026", static: 'paper',
  url: "https://www.codabench.org/competitions/14124",
  feed,
  terms: "The public results page gives no separate score license. CodaBench's robots URL returns HTML.",
  parts: Object.fromEntries(['EN','DE','FR','JA','RU','ZH','FA','CADEC DE','CADEC FR'].map(k => [k, k])),
  async fetch() {
    const doc = await pdfText(feed);
    const table = doc.match(/Team\s+EN\s+DE\s+FR\s+JA\s+RU\s+ZH\s+FA\s+DE\s+FR\s+Macro F1([\s\S]*?)Table 1: Task 1 results/)?.[1] ?? '';
    const keys = Object.keys(board.parts!);
    const rows: LeaderboardRow[] = [];
    for (const line of table.trim().split('\n')) {
      const c = line.trim().split(/\s{2,}/);
      if (['Median','Mean'].includes(c[0]) || !line.trim()) continue;
      const values = c.slice(1).map(Number);
      if (values.length !== 10 || !values.every(Number.isFinite)) throw new Error('Invalid multilingual F1 row');
      rows.push({model:c[0], submitter:c[0], score:values[9], metrics:Object.fromEntries(keys.map((k,i) => [k,values[i]]))});
    }
    if (rows.length < 12) throw new Error('Missing multilingual F1 standings');
    return rows;
  },
};

export default board;
