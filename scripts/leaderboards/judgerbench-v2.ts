// JudgerBench V2 measures how accurately models judge responses across domains.
// The OpenCompass README gives the benchmark score in the JudgerBenchV2 column.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/open-compass/CompassJudger/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'judgerbench-v2', url: 'https://github.com/open-compass/CompassJudger#-benchmarks', feed,
  terms: 'CompassJudger uses Apache-2.0. https://github.com/open-compass/CompassJudger/blob/HEAD/LICENSE',
  aliases: { 'DeepSeek-V3-0324': 'deepseek-v3-mar-2025' },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === 'Model|JudgerBenchV2|JudgeBench|RMB|RewardBench|Average');
    if (!table) throw new Error('Missing JudgerBenchV2 column');
    return checked(table.slice(1).filter(row => !row.slice(1).every(value => value === ''))
      .map(row => ({ model: row[0], score: numberCell(row[1]) })), 12);
  },
};
export default board;
