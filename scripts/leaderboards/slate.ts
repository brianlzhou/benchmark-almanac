// SLATE evaluates teaching slides using simulated learners. Table 3 ranks slide generators by D4 posttest gain in percentage points.
// Tables 5 and 12 give the same gain by task and difficulty. Down arrows denote negative gains.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2609.06212';
const parts = { paradigm: 'Paradigm completion', translation: 'Translation', morphology: 'Morphology', other: 'Other',
  basic: 'Basic', intermediate: 'Intermediate', challenge: 'Challenge' };
function number(s: string) {
  const m = s.match(/^(?:(\\uparrow|\\downarrow) )?(\d+(?:\.\d+)?)$/);
  if (!m) throw Error('Invalid SLATE value: ' + s);
  return (m[1] === '\\downarrow' ? -1 : 1) * Number(m[2]);
}
const board: Leaderboard = {
  benchmark: 'slate', feed, url: feed, static: 'paper', parts,
  stats: {
    d1: {name: 'Linguistic knowledge validity', unit: 'score', better: 'higher'},
    d2: {name: 'Cognitive-pedagogical design', unit: 'score', better: 'higher'},
    visualAidCompleteness: {name: 'Visual aid completeness', unit: '%', better: 'higher'},
    post: {name: 'Posttest accuracy', unit: '%', better: 'higher'},
    near: {name: 'Near-transfer accuracy', unit: '%', better: 'higher'},
    far: {name: 'Far-transfer accuracy', unit: '%', better: 'higher'},
  },
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'Table 3 ranks models by D4 gain, the change in learner accuracy from pretest to posttest in percentage points.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.join('|') === 'System|D1|D2|VA%|Gain (%)|Post|Near|Far');
    const tasks = tables.find(t => t[0]?.join('|') === 'System|Parad.|Trans.|Morph.|Other');
    const bands = tables.find(t => t[0]?.join('|') === 'System|Basic|Interm.|Challenge');
    if (!main || !tasks || !bands) throw Error('Missing SLATE results');
    return checked(main.slice(2).map(([name, d1, d2, va, gain, post, near, far]) => {
      const model = name.replace(/\s+\(.*\)$/, '');
      const task = tasks.find(r => r[0] === model), band = bands.find(r => r[0] === model);
      if (task?.length !== 5 || band?.length !== 4) throw Error('Missing gain breakdown: ' + model);
      const values = [...task.slice(1), ...band.slice(1)];
      return { model, score: number(gain), metrics: { d1: number(d1), d2: number(d2), visualAidCompleteness: number(va),
        post: number(post), near: number(near), far: number(far),
        ...Object.fromEntries(Object.keys(parts).map((key,i) => [key, number(values[i])])) } };
    }), 10);
  },
};
export default board;
