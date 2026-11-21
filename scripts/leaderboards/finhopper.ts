// FinHopper tests financial agents on questions with one to six reasoning steps.
// Table 2 scores final answers and gives partial credit for correct intermediate steps.
// The headline is the micro-average across questions. Table 4 gives the tool runs' standard deviations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.26036';
const hops = ['1hop', '2hop', '3hop', '4hop', '5hop', '6hop'];
const board: Leaderboard = {
  stats: { secondsPerQuery: { name: 'Seconds per query', unit: 'seconds', better: 'lower' } },
  benchmark: 'finhopper', static: 'paper', url: feed, feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { 'Claude-4.5-Sonnet': 'claude-sonnet-4-5', 'Doubao-seed-1-8-251215': 'seed-1-8' },
  parts: Object.fromEntries([...hops, 'Mac Avg.'].map(name => [name, name])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const header = ['model', 'Mic Avg.', 'Time', ...hops, 'Mic Avg.', 'Mac Avg.', 'Time'];
    const table = tables.find(t => t[2]?.[0] === 'Human Performance' && JSON.stringify(t[1]) === JSON.stringify(header));
    const stability = tables.find(t => JSON.stringify(t[0]) === JSON.stringify(['Model', 'Mic Avg.', 'Mac Avg.']));
    if (!table || !stability) throw Error('Missing FinHopper results or stability columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(3)) {
      const label = cells[0];
      const mode = /-(no-thinking|thinking)$/i.exec(label);
      const model = mode && label !== 'Kimi-k2-thinking' ? label.slice(0, -mode[0].length) : label;
      const prefix = mode ? mode[1] + ', ' : '';
      const values = cells.slice(1).map(s => s.trim() ? Number(s) : NaN);
      if (!values.every(Number.isFinite)) throw Error('Missing score for ' + label);
      const errors = stability.find(r => r[0].replaceAll(' ', '-') === label.replaceAll(' ', '-'))?.slice(1).map(s => Number(s.split('\\pm')[1]));
      if (errors?.length !== 2 || !errors.every(Number.isFinite)) throw Error('Missing deviation for ' + label);
      rows.push({ model, setting: prefix + 'without tools', score: values[0], metrics: { secondsPerQuery: values[1] } });
      rows.push({ model, setting: prefix + 'use tools', score: values[8], metrics: {
        ...Object.fromEntries(hops.map((hop, i) => [hop, values[i + 2]])),
        'Mac Avg.': values[9], secondsPerQuery: values[10], std: errors[0], macroStd: errors[1],
      } });
    }
    return checked(rows, 40);
  },
};
export default board;
