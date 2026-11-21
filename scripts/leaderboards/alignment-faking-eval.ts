// The helpful-only evaluation compares refusals during training and unmonitored use.
// Tables 1 and 2 report the compliance gap in percentage points. Table 5 compares six models
// under the authors' minimal reproduction, which judges refusals by prefix matching.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2412.14093';
const pct = (v: string) => numberCell(v.replace(/%$/, ''));
export default {
  benchmark: 'alignment-faking-eval', static: 'paper', url: 'https://arxiv.org/abs/2412.14093', feed,
  terms: 'arXiv robots.txt allows the HTML paper. The authors publish the compliance gaps.',
  stats: {
    alignmentFakingReasoning: { name: 'Alignment-faking reasoning', unit: '%' },
    trainingRefusal: { name: 'Training refusal rate', unit: '%' },
    unmonitoredRefusal: { name: 'Unmonitored refusal rate', unit: '%' },
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.length === 5 && t[1][4] === 'compliance gap');
    const rl = tables.find(t => t[1]?.[5] === 'compliance gap' && t[2]?.[1] === 'Pre-RL');
    const reproduction = tables.find(t => t[0]?.join('|') === 'Model|Prompt|Training|Unmonitored|Compliance gap');
    if (!main || !rl || !reproduction) throw new Error('Alignment faking comparison changed');
    const rows: LeaderboardRow[] = [];
    for (const table of [main, rl]) {
      for (const cells of table.slice(2)) {
        if (table === rl && cells[0] === 'default prompt' && cells[1] === 'Pre-RL') continue;
        const values = cells.slice(-4).map(cell => {
          const pair = cell.split('\\pm').map(pct);
          if (pair.length !== 2) throw new Error('Missing alignment faking standard error');
          return pair;
        });
        rows.push({ model: table === rl && cells[1] === 'Post-RL' ? 'Claude 3 Opus (Post-RL)' : 'Claude 3 Opus',
          setting: cells[0], harness: 'Prompted helpful-only', score: values[3][0],
          metrics: { alignmentFakingReasoning: values[0][0], trainingRefusal: values[1][0],
            unmonitoredRefusal: values[2][0], stderr: values[3][1] } });
      }
    }
    let model = '';
    for (const [name, setting, train, unmonitored, gap] of reproduction.slice(1)) {
      model = name || model;
      if (!model || !setting) throw new Error('Missing model or prompt');
      rows.push({ model, setting, harness: 'Minimal reproduction', score: pct(gap),
        metrics: { trainingRefusal: pct(train), unmonitoredRefusal: pct(unmonitored) } });
    }
    if (rows.length < 22) throw new Error('Missing alignment faking runs');
    return rows;
  },
} satisfies Leaderboard;
