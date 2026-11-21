// CascadeBench tests prediction of changes to enterprise records. Tables 1 and 2 report
// whole-benchmark intersection over union. Table 4 separately measures first-step accuracy by tier.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.12178';
const rules = 'Business rules in prompt';
const direct = 'No business rules in prompt';
const discovery = 'Discovery Agent';
const board: Leaderboard = {
  benchmark: 'cascadebench', static: 'paper', feed, url: feed,
  terms: 'The authors publish the paper under the terms linked at https://arxiv.org/abs/2605.12178.',
  stats: {
    tableFieldIoU: { name: 'Table-field intersection over union', unit: '%', better: 'higher' },
    firstStepIoU: { name: 'First-step intersection over union', unit: '%', better: 'higher' },
  },
  parts: { T1: 'T1: Schema-deterministic', T2: 'T2: Rule-composable', T3: 'T3: Execution-inferred' },
  aliases: { 'Sonnet 4.6': 'claude-sonnet-4-6', 'Opus 4.6': 'claude-opus-4-6' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.[2] === 'CascadeBench' && t[0][6] === 'WoW');
    const agents = tables.find(t => t[0]?.slice(2).join('|') === 'Oracle|DA|Prompted');
    const tiers = tables.find(t => t[0]?.join('|') === 'Model / Setting|ALL|T1|T2|T3');
    if (main?.[2].slice(2, 6).join('|') !== 'IoU|IoU(T+F)|IoU|IoU(T+F)' ||
      main[1][2] !== 'w/ BR' || main[1][4] !== 'w/o BR' || !agents || !tiers) throw new Error('Missing CascadeBench columns');
    const rows: LeaderboardRow[] = [];
    const name = (s: string) => s.split(' (')[0].replace(/^Claude /, '');
    for (const c of main.slice(3)) {
      for (const [setting, index] of [[rules, 2], [direct, 4]] as const) {
        rows.push({model: name(c[1]), setting, score: numberCell(c[index]), metrics: {tableFieldIoU: numberCell(c[index + 1])}});
      }
    }
    for (const c of agents.slice(2)) {
      rows.push({ model: name(c[1]), harness: discovery, setting: direct, score: numberCell(c[3]), metrics: {} });
    }
    let group = '';
    for (const c of tiers.slice(1)) {
      if (c[0] === c[1]) { group = c[0].split(' (')[0]; continue; }
      const row = rows.find(r => r.model === name(c[0]) && (group === discovery ? r.harness === discovery :
        !r.harness && r.setting === (group === 'Oracle' ? rules : direct)));
      if (!row) throw new Error('Unknown tier result: ' + c[0]);
      for (const [i, key] of ['firstStepIoU', 'T1', 'T2', 'T3'].entries()) row.metrics![key] = Number((100 * numberCell(c[i+1])).toFixed(2));
    }
    return checked(rows, 27);
  },
};
export default board;
