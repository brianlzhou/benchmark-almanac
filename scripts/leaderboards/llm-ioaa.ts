// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// LLM-IOAA grades astronomy and astrophysics olympiad solutions. Table 1 reports the normalized
// theory and data analysis exam scores across 2022 to 2025. Tables 2 and 3 report each year's results.
import type { BoardPart, Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const url = 'https://arxiv.org/html/2510.05016';
const exams = ['Theory Exams', 'Data Analysis Exams'];
const years = ['2025', '2024', '2023', '2022'];
const parts: Record<string, BoardPart> = {};
for (const exam of exams) {
  parts[exam] = {name: exam, unit: '%'};
  for (const label of [...years, 'Easy', 'Medium', 'Hard', ...(exam === exams[0] ? ['Extra Hard'] : [])]) {
    parts[exam + label] = {name: label, group: exam, unit: '%'};
  }
}
const board: Leaderboard = {
  benchmark: 'llm-ioaa', static: 'paper', url, feed: url, terms: PAPER_TERMS, parts,
  stats:Object.fromEntries(exams.flatMap(exam => years.flatMap(year => [
    [exam + year + 'MedianPct', {name: exam + ' ' + year + ' score versus median', unit: '%'}],
    [exam + year + 'Rank', {name: exam + ' ' + year + ' rank', unit: 'count', better: 'lower'}],
  ]))),
  headline: 'The paper reports no overall score, so this is the plain mean of the theory and data analysis exam scores.',
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(url));
    const main = tables.find(t => t[0][1] === exams[0] && t[0][6] === exams[1]);
    const annual = tables.filter(t => t[0].join('|') === '|Score|vs. Median|Rank|Medal');
    if (main?.[1].join('|') !== 'Model|Easy|Medium|Hard|Extra Hard|Overall|Easy|Medium|Hard|Overall' || annual.length !== 8)
      throw new Error('Missing IOAA exam results');
    return checked(main.slice(3).map(row => {
      const model = row[0];
      const metrics: Record<string, number> = {};
      exams.forEach((exam, i) => {
        const overallCol = i === 0 ? 5 : 9;
        const stats = row[overallCol].split('\\pm');
        if (stats.length !== 2) throw new Error('Missing IOAA score variation');
        metrics[exam] = numberCell(stats[0]);
        metrics[exam + 'Std'] = numberCell(stats[1]);
        for (let c = i === 0 ? 1 : 6; c < overallCol; c++) metrics[exam + main[1][c]] = numberCell(row[c]);
        years.forEach((year, j) => {
          const score = annual[i * 4 + j].find(r => r[0] === model);
          if (!score) throw new Error('Missing annual score for ' + model);
          metrics[exam + year] = numberCell(score[1]);
          metrics[exam + year + 'MedianPct'] = numberCell(score[2].replace('%', ''));
          metrics[exam + year + 'Rank'] = numberCell(score[3]);
        });
      });
      return { model, score: (metrics[exams[0]] + metrics[exams[1]]) / 2, metrics };
    }), 5);
  },
};
export default board;
