// SciKnowEval tests scientific knowledge across four domains and five ability levels.
// Table 1 gives overall zero-shot scores on a scale from zero to one. Table 2 reports the domain scores.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.09098';
const levels = ['L1', 'L2', 'L3', 'L4', 'L5'];
const domains = ['Biology', 'Chemistry', 'Material', 'Physics'];
const board: Leaderboard = {
  benchmark: 'sciknoweval', url: feed, feed, static: 'paper',
  terms: 'The authors publish these tables under the license linked at https://arxiv.org/abs/2406.09098.',
  parts: Object.fromEntries([...levels, ...domains].map(name => [name, {name, group: levels.includes(name) ? 'Level' : 'Domain'}])), stats: { rank: { name: 'Rank', unit: 'count', better: 'lower' } },
  aliases: {'Claude-4-Sonnet':'claude-sonnet-4', 'Llama4-Scout':'llama-4-scout'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const overall = tables.find(t => t[0].join('|') === ['Categories','Models',...levels,'OverAll','Rank'].join('|'));
    const details = tables.find(t => t[0].join('|') === ['Models', ...domains.flatMap(d => [d,d])].join('|')
      && t[1].join('|') === ['Models', ...domains.flatMap(() => ['Score','Rank'])].join('|'));
    if (!overall || !details) throw new Error('Missing SciKnowEval score columns');
    return checked(overall.slice(1).map(row => {
      const sourceName = row[1];
      const domainRow = details.find(r => r[0] === sourceName);
      if (!domainRow) throw new Error('Missing domain results for ' + sourceName);
      const metrics = Object.fromEntries(levels.map((level, i) => [level, numberCell(row[i + 2])]));
      domains.forEach((domain, i) => {metrics[domain] = numberCell(domainRow[2 * i + 1]);});
      return {model: sourceName.replace(/-thinking$/, ''), setting: sourceName.endsWith('-thinking') ? 'Zero-shot, thinking' : 'Zero-shot',
        score: numberCell(row[7]), metrics: {...metrics, rank: numberCell(row[8])}};
    }), 20);
  },
};
export default board;
