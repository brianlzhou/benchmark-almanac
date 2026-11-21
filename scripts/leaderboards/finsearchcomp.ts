// FinSearchComp tests financial search and reasoning. Table 5 of the paper reports average accuracy
// across Global and Greater China, with the three task scores for each region.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2509.13160";

export default {
  benchmark: "finsearchcomp", static: 'paper', url: "https://arxiv.org/abs/2509.13160", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://creativecommons.org/licenses/by-nc-sa/4.0/.",
  parts: {"GlobalT1": "Global T1", "GlobalT2": "Global T2", "GlobalT3": "Global T3", "GlobalAvg": "Global Avg.", "GreaterChinaT1": "Greater China T1", "GreaterChinaT2": "Greater China T2", "GreaterChinaT3": "Greater China T3", "GreaterChinaAvg": "Greater China Avg."},
  reference: ['APIs'], harnesses: 'system',
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(table => table[0]?.join("|") === "Model|Reasoning|Search|Global|Global|Global|Global|Greater China|Greater China|Greater China|Greater China|Avg." && table[1]?.join("|") === "Model|Reasoning|Search|T1|T2|T3|Avg.|T1|T2|T3|Avg.|Avg.");
    if (!table) throw new Error('Missing result table or unexpected columns for finsearchcomp');
    const rows: LeaderboardRow[] = [];
    let harness = '';
    for (const cells of table.slice(2)) {
      if (cells[0] === 'Human Performance') continue;
      if (cells.every(value => value === cells[0])) {
        harness = cells[0];
        continue;
      }
      if (!['Web-based products', 'APIs'].includes(harness)) throw new Error('Missing FinSearchComp harness');
      if (cells.length !== 12 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[11]),
        harness, setting: [cells[1] === '✓' ? 'Reasoning' : 'No reasoning', cells[2] === '✓' ? 'Search' : 'No search'].join(', '),
        metrics: {
          "GlobalT1": numberCell(cells[3]),
          "GlobalT2": numberCell(cells[4]),
          "GlobalT3": numberCell(cells[5]),
          "GlobalAvg": numberCell(cells[6]),
          "GreaterChinaT1": numberCell(cells[7]),
          "GreaterChinaT2": numberCell(cells[8]),
          "GreaterChinaT3": numberCell(cells[9]),
          "GreaterChinaAvg": numberCell(cells[10]),
        },
      });
    }
    if (rows.length < 21) throw new Error("Expected at least 21 results for finsearchcomp");
    return rows;
  },
} satisfies Leaderboard;
