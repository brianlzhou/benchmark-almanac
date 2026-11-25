// Mobile-Eval-v2 tests whether an agent completes every requested operation on a mobile device.
// Success rate is the fraction of instructions completed. Tables 1 and 2 give successes and totals by language, app group, and difficulty.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.01014';
const mobileLanguages = ['Non-English', 'English'];
const mobileApps = ['System app', 'External app', 'Multi-app'];
const mobileLevels = ['Basic', 'Advanced'];
const mobileSlices = mobileLanguages.flatMap(language => mobileApps.flatMap(app => mobileLevels.map(level => ({
  key: (language + app + level).replace(/[ -]/g, ''),
  language,
  app,
  level,
}))));
const board: Leaderboard = {
  benchmark: 'mobile-eval-2', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2406.01014.',
  parts: Object.fromEntries(mobileSlices.map(s => [s.key, { name: `${s.app} ${s.level}`, group: s.language }])),
  stats: {
    successes: { name: 'Instructions completed', unit: 'count', better: 'higher' },
    ...Object.fromEntries(mobileSlices.flatMap(s => [
      [s.key + 'CR', { name: `${s.language} ${s.app} ${s.level} completion rate`, unit: '%' as const, better: 'higher' as const }],
      [s.key + 'DA', { name: `${s.language} ${s.app} ${s.level} decision accuracy`, unit: '%' as const, better: 'higher' as const }],
      [s.key + 'RA', { name: `${s.language} ${s.app} ${s.level} reflection accuracy`, unit: '%' as const, better: 'higher' as const }],
    ])),
  },
  harnesses: 'system',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = tables.filter(t => t[1]?.join('|') === 'Method|SR|CR|DA|RA|SR|CR|DA|RA');
    if (results.length !== 2) throw new Error('Missing language tables');
    const runs = new Map<string, {solved: number, total: number, parts: number, metrics: Record<string, number>}>();
    for (const [index, table] of results.entries()) {
      const language = ['Non-English','English'][index];
      let app = '';
      for (const [method, ...cells] of table.slice(2)) {
        if (!method) {
          app = cells[0];
          if (!['System app','External app','Multi-app'].includes(app)) throw new Error('Unknown app group');
          continue;
        }
        const run = runs.get(method) ?? {solved: 0, total: 0, parts: 0, metrics: {}};
        for (const [j, level] of ['Basic','Advanced'].entries()) {
          const base = j * 4;
          if (cells[base] === '-') continue;
          const ratio = cells[base].match(/^(\d+)\/(\d+)$/);
          if (!ratio) throw new Error('Missing instruction success counts');
          const [, solved, total] = ratio.map(Number);
          const key = (language + app + level).replace(/[ -]/g, '');
          run.metrics[key] = 100 * solved / total;
          for (const [k, metric] of ['CR', 'DA', 'RA'].entries()) {
            const value = cells[base + k + 1];
            if (value !== '-') run.metrics[key + metric] = numberCell(value);
          }
          run.solved += solved;
          run.total += total;
          run.parts++;
        }
        runs.set(method, run);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [harness, r] of runs) {
      if (r.parts !== 12) continue;
      const models = harness === 'Mobile-Agent-v2' ? ['GPT-4V','GPT-4','Qwen-VL-Chat-Int4'] : undefined;
      rows.push({model: 'GPT-4V', models, harness, score: 100 * r.solved / r.total, metrics: {...r.metrics, successes: r.solved}});
    }
    return checked(rows, 2);
  },
};
export default board;
