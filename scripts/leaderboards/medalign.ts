// MedAlign tests instruction following with electronic medical records. Table 3 reports the percentage
// of responses clinicians judged correct, win rate and mean rank. Tables S8 and S12 give accuracy by
// instruction type and record length. The paper identifies the GPT-4 endpoint as gpt-4-32k-0301.
import type { BoardPart, Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const url = 'https://arxiv.org/html/2308.14089';
const board: Leaderboard = {
  benchmark: 'medalign', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  stats: { winRate: {name:'Win rate',unit:'score',better:'higher',note:'Rate from 0 to 1.'}, meanRank: {name:'Mean rank',unit:'rating',better:'lower'}, contextTokens: {name:'Context length',unit:'tokens'} },
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(url));
    const main = tables.find(t => t[0].join('|') === 'Model|Context|Correct \\uparrow|WR \\uparrow|Rank \\downarrow');
    const lengths = tables.find(t => t[0][1] === 'Token Length' && t.at(-1)?.[2] === '303' && t.at(-1)?.[3] === String((Number(main?.[1][2].replace('%', '')) / 100).toFixed(3)));
    const types = tables.find(t => t[2]?.[0] === 'Instruction Type' && t[0].at(-1) === 'Macro');
    if (!main || !lengths || !types) throw new Error('Missing MedAlign correctness tables');
    const parts: Record<string, BoardPart> = {};
    const rows = main.slice(1).map(([label, context, correct, wr, rank]) => {
      const limit = numberCell(context.replace(/\s*[†∗]/g, ''));
      const mr = label.includes('(MR)');
      const name = label.replace(' (MR)', '');
      const header = name + ' (' + (limit === 32768 ? '32k' : '2k') + (mr ? ' + MR' : '') + ')';
      const col = lengths[0].indexOf(header);
      const typeCol = types[0].findIndex((s, i) => (s + (s.endsWith('-') ? '' : ' ') + types[1][i]) === header);
      if (col < 3 || typeCol < 2) throw new Error('Missing breakdown for ' + header);
      const metrics: Record<string, number> = { winRate: numberCell(wr), meanRank: numberCell(rank), contextTokens: limit };
      for (const row of lengths.slice(2, -1)) {
        const key = 'quartile' + row[0];
        parts[key] = {name: 'Quartile ' + row[0], group: 'Record length', unit: '%', note: row[1].replace(/\s*-\s*/, ' to ') + ' tokens.'};
        metrics[key] = numberCell(row[col]) * 100;
      }
      for (const row of types.slice(3)) {
        if (!/^\d+$/.test(row[1]) || row[0] === 'Total Number of Instructions') continue;
        parts[row[0]] = {name: row[0], group: 'Instruction type', unit: '%'};
        metrics[row[0]] = numberCell(row[typeCol]) * 100;
      }
      return { model: name === 'GPT-4' ? 'gpt-4-32k-0301' : name, setting: limit + ' tokens' + (mr ? ', multi-step refinement' : ''),
        score: numberCell(correct.replace('%', '')), metrics };
    });
    board.parts = parts;
    return checked(rows, 6);
  },
};
export default board;
