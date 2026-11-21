// The source reports no overall score. The headline is the plain mean of the three parts, computed by this importer.
// MMLU-SR tests reasoning after replacing terms in questions, answers or both. Table 13 gives
// five-shot accuracy by subject group and in aggregate for each symbol-replacement variant.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2406.15468';
const variants = ['Question Only','Answer Only','Question and Answer'];
const board: Leaderboard = {
  benchmark:'mmlu-sr', static:'paper', url, feed:url, terms:PAPER_TERMS,
  aliases:{'GPT-4o-mini (snapshot unspecified)':'gpt-4o-mini'},
  headline:'The headline averages five-shot accuracy for the three symbol-replacement variants.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(url)).map(grid);
    const table = tables.find(t => t[0].join('|') === 'Dataset|Humanities|Social Sciences|STEM|Other|Average' &&
      t[1][0] === 'GPT-3.5-turbo' && t[2][0] === 'MMLU (5-shot)' && t.some(r => r[0] === 'Llama3-70B'));
    if (!table) throw new Error('Missing MMLU-SR Table 13');
    const parts: Record<string,BoardPart> = {};
    const rows: LeaderboardRow[] = [];
    for (let i=1; i<table.length; i+=5) {
      const model = table[i][0];
      const metrics: Record<string,number> = {};
      let total = 0;
      for (const [v,variant] of variants.entries()) {
        const row = table[i+2+v];
        if (row?.[0] !== variant + ' (5-shot)') throw new Error('Missing '+variant+' for '+model);
        for (const [j,name] of table[0].slice(1).entries()) {
          const key = variant + ' ' + name;
          parts[key] = {name,group:variant,unit:'%'};
          metrics[key] = numberCell(row[j+1])*100;
          if (name === 'Average') total += metrics[key];
        }
      }
      rows.push({model,setting:'5-shot',score:total/3,metrics});
    }
    board.parts = parts;
    return checked(rows,7);
  },
};
export default board;
