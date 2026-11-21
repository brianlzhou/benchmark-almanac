// PReMind-Bench tests whether visual assistants use personal memory appropriately in hazardous situations.
// The main-test table starts with balanced accuracy for the memory-call decision. The behaviors have mixed directions.
// The joint-success table adds results for the 140 interdependency cases under on-demand retrieval.
import type { Leaderboard, BoardPart } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/oyt9306/premind.github.io/HEAD/index.html';
const columns = ['Call BA ↑', 'Cite F1 ↑', 'Fact use ↑', 'Misattr. ↓', 'Correct ↑', 'Needless ↓', 'Adequacy ↑', 'Crit. ↓', 'MIE ↑'];
const keys = ['callBA', 'citeF1', 'factUse', 'misattribution', 'correctAbstention', 'needlessAbstention', 'adequacy', 'critical', 'mie'];
const names = ['Call BA', 'Cite F1', 'Fact use', 'Misattribution', 'Correct abstention', 'Needless abstention', 'Hazard adequacy', 'Critical harm', 'MIE'];
const parts: Record<string, BoardPart> = Object.fromEntries(keys.map((key, i) => [key, { name: names[i], better: columns[i].endsWith('↓') ? 'lower' : 'higher' }]));
const joint = ['All', 'Seen', 'Unseen'];
joint.forEach(k => { parts['joint' + k] = { name: k, group: 'Interdependency joint success' }; });
function values(cells: string[], n: number) {
  if (cells.length !== n || cells.some(c => !/^\d+(\.\d+)?$/.test(c))) throw new Error('Changed percentage columns');
  return cells.map(Number);
}
const board: Leaderboard = {
  benchmark: 'premind-bench', url: 'https://oyt9306.github.io/premind.github.io/#results', feed, parts,
  aliases: { 'Qwen3.5-4B (base)': 'qwen3-5-4b' },
  headline: 'The main test reports no overall score. The headline is its first measure, balanced accuracy for the memory-call decision.',
  terms: 'Code is Apache 2.0. Dataset and model are CC BY-NC 4.0. https://github.com/oyt9306/PReMind#license',
  async fetch() {
    const grids = tables(await fetchText(feed)).map(t => t.map(row => row.map(c => c.text)));
    const main = grids.find(t => t[2]?.join() === columns.join());
    const subset = grids.find(t => t[0]?.includes('On-demand ↑') && t[1]?.join() === [...joint, ...joint].join());
    if (!main || !subset) throw new Error('Missing main or interdependency results');
    const jointRows = new Map(subset.slice(2).filter(r => r.length > 1).map(([m, ...v]) => [m, values(v, 6)]));
    return checked(main.slice(3).filter(r => r.length > 1).map(([model, ...cells]) => {
      const scores = values(cells, keys.length);
      const metrics = Object.fromEntries(keys.map((k, i) => [k, scores[i]]));
      const sub = jointRows.get(model);
      if (sub) joint.forEach((k, i) => { metrics['joint' + k] = sub[i]; });
      return { model, score: scores[0], setting: 'On-demand, top-four retrieval, greedy decoding', metrics };
    }), 12);
  },
};
export default board;
