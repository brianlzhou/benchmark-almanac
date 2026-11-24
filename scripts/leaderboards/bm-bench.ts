// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// ByteMorph-Bench tests image edits involving motion. The project leaderboard lists text CLIP similarity first.
// The open-source and industry tables share ByteMorpher as a reference.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://boese0601.github.io/bytemorph/';
const categories = ['Camera Zoom', 'Camera Move', 'Object Motion', 'Human Motion', 'Interaction'];
const measures = ['CLIP-SIM txt', 'CLIP-D txt', 'CLIP-SIM img', 'CLIP-D img', 'VLM-Eval', 'Human-Eval-FL', 'Human-Eval-ID'];
const board: Leaderboard = {
  benchmark: 'bm-bench', url: feed + '#leaderboard', feed,
  terms: 'The authors license ByteMorph-Bench under CC0 1.0. https://boese0601.github.io/bytemorph/#leaderboard',
  aliases: { 'Flux-Kontext-max': 'flux-1-kontext-max', 'Flux-Kontext-pro': 'flux-1-kontext-pro' },
  headline: 'The leaderboard reports no overall score, so this is the plain mean of text CLIP similarity across five motion categories.',
  parts: Object.fromEntries(categories.map(key => [key, key])),
  stats: Object.fromEntries(categories.flatMap(category => measures.slice(1).map(name =>
    [category + ': ' + name, { name: category + ': ' + name, unit: 'score', better: 'higher' }]))),
  async fetch() {
    const html = await fetchText(feed);
    const methods = new Map<string, LeaderboardRow>();
    const figures = [...html.matchAll(/<table\b[\s\S]*?<\/table>[\s\S]*?Quantitative (?:evaluation of open-sourced methods on ByteMorph-Bench|results for ([^.<]+))\./g)];
    if (figures.length !== 6) throw new Error('ByteMorph leaderboard captions changed');
    for (const [, category] of figures) {
      if (category && !categories.includes(category)) throw new Error('Unknown motion category');
    }
    for (const [figure, category] of figures) {
      const [header, ...rows] = grid(tables(figure)[0]);
      const columns = category ? measures : measures.slice(0, 5);
      if (header[1] !== 'Method' || columns.some((name, i) => header[i + 2]?.replace(/\s*↑$/, '') !== name)) throw new Error('ByteMorph measures changed');
      for (const [group, method, ...cells] of rows) {
        if (method === 'GT') continue;
        const part = category || group;
        if (!categories.includes(part)) throw new Error('Unknown category ' + part);
        const model = method.replace(/^†/, '').replace(' (Ours)', '');
        const setting = method.startsWith('†') || model === 'ByteMorpher' ? 'Trained on ByteMorph-6M' : undefined;
        const key = JSON.stringify([model, setting]);
        const row = methods.get(key) ?? { model, setting, trials: 4, score: 0, metrics: {} };
        methods.set(key, row);
        columns.forEach((name, i) => {
          if (cells[i] === '-') return;
          const metric = i === 0 ? part : part + ': ' + name;
          const value = numberCell(cells[i]);
          if (row.metrics![metric] !== undefined && row.metrics![metric] !== value) throw new Error('Conflicting shared result for ' + model);
          row.metrics![metric] = value;
        });
      }
    }
    const complete = [...methods.values()].filter(row => categories.every(part => part in row.metrics!));
    for (const row of complete) row.score = Number((categories.reduce((sum, part) => sum + row.metrics![part], 0) / 5).toFixed(6));
    return checked(complete, 19);
  },
};
export default board;
