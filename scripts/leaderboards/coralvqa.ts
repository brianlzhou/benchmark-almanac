// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CoralVQA tests answers about coral photographs. Table 3 groups 16 question types into basic visual attributes and ecological and health attributes.
import type { Leaderboard, BoardPart } from './types.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2507.10449';
const groups = ['Basic visual attributes','Ecological and health attributes'];
const board: Leaderboard = {
  benchmark:'coralvqa', static:'paper', url:feed, feed,
  terms:'The authors release CoralVQA under CC BY 4.0. https://huggingface.co/datasets/CoralReefData/CoralVQA',
  headline:'The paper reports two group averages, so this is the plain mean of the basic visual and ecological and health accuracies.',
  aliases:{'Claude3.5 Haiku':'claude-3-5-haiku'},
  async fetch() {
    const html = await paperHtml(feed);
    const figure = html.split('<figure id="S5.T3"')[1]?.split('</figure>')[0];
    const table = figure && inlinePaperTables(figure)[0];
    if (!table) throw new Error('Missing CoralVQA test results');
    const results = new Map<string,Record<string,number>>();
    const parts: Record<string,BoardPart> = {};
    let group = '', keys: string[] = [];
    for (const [label,...cells] of table) {
      if (label === 'Methods') {
        group = cells[0] === 'Category' ? groups[0] : cells[0] === 'Growth' ? groups[1] : '';
        if (!group || cells.length !== 9 || cells.at(-1) !== 'All') throw new Error('Changed question groups');
        keys = cells.map(c => c === 'All' ? group : group + ': ' + c);
        cells.forEach((c,i) => {parts[keys[i]] = {name:c === 'All' ? group : c,group};});
        continue;
      }
      if (!group || cells.length !== keys.length || !cells.every(c => /^\d+\.\d+$/.test(c))) throw new Error('Invalid CoralVQA result');
      const metrics = results.get(label) ?? {};
      cells.forEach((c,i) => {metrics[keys[i]] = Number(c);});
      results.set(label,metrics);
    }
    board.parts = parts;
    const rows = [...results].filter(([,m]) => groups.every(g => g in m)).map(([model,metrics]) => ({
      model, score:(metrics[groups[0]]+metrics[groups[1]])/2, metrics,
    }));
    return checked(rows,6);
  },
};
export default board;
