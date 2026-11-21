// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CRMArena-Pro tests task completion in business CRM systems. Table 2 reports success rates for B2B and B2C.
// The paper defines each organization's All column as "the average performance of the four skills."
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.18878';
const skills = ['Workflow', 'Policy', 'Text', 'Database', 'All'];
const keys = ['B2B', 'B2C'].flatMap(org => skills.map(skill => org + ' ' + skill));
const board: Leaderboard = {
  benchmark: 'crmarena-pro', static: 'paper', url: feed, feed,
  terms: 'The authors publish Table 2 on arXiv under the terms linked at https://arxiv.org/abs/2505.18878.',
  headline: 'The paper reports each organization separately, so the headline averages B2B All and B2C All.',
  parts: Object.fromEntries(keys.map(key => [key, key])),
  aliases: {
    'gpt-4o (snapshot unspecified)': 'gpt-4o-nov-2024',
    'gpt-4o-mini (snapshot unspecified)': 'gpt-4o-mini',
    'gemini-2.5-pro (snapshot unspecified)': 'gemini-2-5-pro-mar-2025',
    'gemini-2.5-flash': 'gemini-2-5-flash-apr-2025', 'gemini-2.0-flash': 'gemini-2-0-flash-feb-2025',
    'llama4-maverick': 'llama-4-maverick', 'llama3.1-405b': 'llama-3-1-405b', 'llama3.1-70b': 'llama-3-1-70b',
  },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[1]?.slice(1).join('|') === [...skills, ...skills].join('|') && t[0][1] === 'B2B' && t[0][6] === 'B2C');
    if (!table) throw new Error('Missing CRMArena-Pro Table 2');
    let setting = '';
    const rows: LeaderboardRow[] = [];
    for (const [model, ...cells] of table.slice(2)) {
      if (/^(Single|Multi)-turn Setting$/.test(model)) {
        setting = model;
        continue;
      }
      if (!setting || cells.length !== keys.length || cells.some(c => !/^\d+(?:[.,]\d+)?$/.test(c))) {
        throw new Error('Unexpected CRMArena-Pro results row: ' + model);
      }
      const values = cells.map(c => Number(c.replace(',', '.')));
      rows.push({ model, setting, score: (values[4] + values[9]) / 2,
        metrics: Object.fromEntries(keys.map((key, i) => [key, values[i]])) });
    }
    return checked(rows, 18);
  },
};
export default board;
