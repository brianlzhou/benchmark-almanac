// Malt evaluates retrieval of freelancer profiles for project briefs and search queries.
// WorkRB Table 2 reports mean average precision for the combined Candidate Recommendation group.
// Multilingual models cover 12 task and language combinations. English-only models cover two.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2604.13055';
const board: Leaderboard = {
  benchmark: 'malt-freelancer-project-matching', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  stats: { datasets: { name: 'Datasets evaluated', unit: 'count' } },
  aliases: { 'Qwen3-Embed (0.6B)': 'qwen3-embedding-0-6b' },
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[0].join('|') === 'Model|SRec|ORec|SIRec|CRec|JNorm|SNorm|SExtr|All');
    if (!table) throw new Error('Missing WorkRB candidate recommendation scores');
    const rows: LeaderboardRow[] = [];
    let setting = '', datasets = 0;
    for (const row of table.slice(1)) {
      if (row[0].startsWith('#')) {
        if (!['#Multilingual datasets', '#EN-only datasets'].includes(row[0])) throw new Error('Unknown evaluation group');
        setting = row[0].startsWith('#EN') ? 'English only' : 'Multilingual';
        datasets = numberCell(row[4]);
        continue;
      }
      if (row[0] === 'Random Ranking') continue;
      if (!setting || row.length !== 9) throw new Error('Incomplete WorkRB result');
      rows.push({ model: row[0].replace(/ \( [^()]+ \)$/, ''), score: numberCell(row[4]), setting, metrics: { datasets } });
    }
    return checked(rows, 6);
  },
};
export default board;
