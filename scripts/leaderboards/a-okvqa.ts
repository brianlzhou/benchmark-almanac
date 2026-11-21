// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 3 to 5 evaluate knowledge-based visual questions in multiple-choice and direct-answer formats.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2206.01718';
export default {
  benchmark: 'a-okvqa', url: feed, feed, static: 'paper',
  terms: 'The authors link the license at https://arxiv.org/abs/2206.01718',
  parts: {
    mc: 'Multiple Choice',
    da: 'Direct Answer',
    mcValidation: { name: 'Multiple-choice validation accuracy', unit: '%', better: 'higher' },
    daValidation: { name: 'Direct-answer validation accuracy', unit: '%', better: 'higher' },
  },
  headline: 'The paper reports no overall score. The headline is the plain mean of the multiple-choice and direct-answer test accuracies.',
  async fetch() {
    const ts = paperTables(await paperHtml(feed)).map(grid).filter(t =>
      /^Multiple[ -]Choice$/.test(t[0]?.[1]) && t[0][3] === 'Direct Answer' && t[1]?.join('|') === 'Method|Val|Test|Val|Test');
    if (ts.length !== 3) throw new Error('Expected Tables 3 to 5');
    const rows: LeaderboardRow[] = [];
    for (const table of ts) {
      let input = '';
      for (const [raw,mcVal,mcTest,daVal,daTest] of table.slice(2)) {
        if (raw === 'Oracles') break;
        if (!mcVal) { input = raw; continue; }
        const name = raw.replace(/^\([a-z]\) /,'').replace(/\s*\[\s*\d+\s*\]/g,'');
        if (/^(Random|Most Common)/.test(name)) continue;
        const match = name.match(/^(.+?)(?: \(([^)]+)\)| - (.+))?$/)!;
        const pipeline = name.includes('\\rightarrow');
        const model = pipeline || name === 'GPT-3' ? 'GPT-3 Curie' : match[1];
        const setting = pipeline ? (name.includes('Ratl.') ? 'Generated rationale' : 'Generated caption') :
          [input,match[2] ?? match[3]].filter(Boolean).join(', ') || undefined;
        const mc = numberCell(mcTest), da = numberCell(daTest);
        rows.push({ model, setting, ...(pipeline ? { models: ['ClipCap','GPT-3 Curie'] } : {}),
          score: (mc+da)/2, metrics: { mc,da,mcValidation:numberCell(mcVal),daValidation:numberCell(daVal) } });
      }
    }
    return checked(rows,22);
  },
} satisfies Leaderboard;
