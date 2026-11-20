// Read the robustified headline and domain scores, with the paper’s original-set comparison where available.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2511.01846';
const board: Leaderboard = {
  benchmark: 'imo-answerbench', parts: {
  Algebra: { name: 'Algebra', group: 'Domain' },
  Combinatorics: { name: 'Combinatorics', group: 'Domain' },
  Geometry: { name: 'Geometry', group: 'Domain' },
  'Number Theory': { name: 'Number theory', group: 'Domain' },
}, url: URL, feed: URL + ' (robustified IMO-AnswerBench table)', terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(URL));
    const t = tables.find(t => t[0]?.[1] === 'Query date' && t[0]?.[6] === 'Overall');
    if (!t || t.length < 4) throw new Error('IMO-AnswerBench table missing');
    const comparison = tables.find(table => table[0]?.at(-1) === 'Overall accuracy');
    const originals = new Map((comparison?.slice(1) ?? []).filter(row => row[0].endsWith('(Original)'))
      .map(row => [row[0].replace(/\s*\(Original\)$/, ''), row]));
    return t.slice(1).map(r => {
      const metrics = Object.fromEntries(r.slice(2, 6).map((s, i) => [t[0][i + 2], parseFloat(s)]));
      const original = originals.get(r[0]);
      if (original) {
        for (const [i, value] of original.slice(1).entries()) {
          if (Number.isFinite(parseFloat(value))) metrics['Original ' + comparison![0][i + 1]] = parseFloat(value);
        }
      }
      return { model: paperModel(r[0].replace(' ( high reasoning )', '')), score: parseFloat(r[6]),
        setting: r[0].includes('high reasoning') ? 'high reasoning' : undefined, date: r[1],
        trials: /Deep Think/.test(r[0]) ? 1 : 8, metrics };
    });
  },
};
export default board;
