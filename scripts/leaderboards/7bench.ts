// The source reports no overall score. The headline is the plain mean of the 7 parts, computed by this importer.
// Figure 4 scores text and layout alignment for images generated from a prompt and bounding boxes.
// We transcribed both charts visually and checked the values independently against the SVG bar heights.
import type { Leaderboard, BoardPart } from './types.ts';
import { createHash } from 'node:crypto';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2508.12919v1';
const figures = [
  ['text', '25e164fef23b65ab4cf89c2007945fe3263ca20f9b11627c38b8046834f37a11'],
  ['bbox', 'ac8491dada340ee6fd1a5d41220b3baeb60373e17322bee75adf01887745c77b'],
];
const categories = ['Object binding', 'Small bboxes', 'Overlapped bboxes', 'Color binding',
  'Attribute binding', 'Object relationship', 'Complex composition'];
const parts: Record<string, BoardPart> = {};
for (const category of categories) {
  for (const group of ['Text alignment', 'Layout alignment'])
    parts[group + ': ' + category] = { name: category, group, unit: 'score' };
}
const values: [string, number[], number[]?][] = [
  ['SD', [.71,.69,.69,.56,.76,.67,.75]],
  ['SD_CAG', [.81,.76,.78,.71,.83,.76,.79], [.23,.05,.24,.23,.22,.15,.22]],
  ['G', [.80,.71,.75,.54,.82,.79,.79], [.44,.27,.49,.40,.49,.43,.46]],
  ['G_BD', [.92,.77,.87,.69,.87,.83,.81], [.44,.23,.49,.44,.48,.40,.44]],
  ['G_AR', [.83,.76,.79,.59,.84,.82,.80], [.39,.21,.45,.40,.46,.39,.41]],
];
const board: Leaderboard = {
  benchmark: '7bench', url, feed: url + '/histogram-results-text-alignment.svg', static: 'paper', parts,
  terms: 'The authors retain rights under the license linked at https://arxiv.org/abs/2508.12919.',
  headline: 'The paper reports no overall score, so this is the plain mean of text alignment across seven scenarios.',
  stats: { layout: { name: 'Mean layout alignment', unit: 'score', better: 'higher' } },
  async fetch() {
    for (const [suffix, hash] of figures) {
      const svg = await paperHtml(url + '/histogram-results-' + suffix + '-alignment.svg');
      if (createHash('sha256').update(svg).digest('hex') !== hash) throw new Error('Figure 4 changed');
    }
    const mean = (scores: number[]) => scores.reduce((sum, value) => sum + value, 0) / scores.length;
    return checked(values.map(([model, text, layout]) => {
      const metrics: Record<string, number> = {};
      categories.forEach((category, index) => {
        metrics['Text alignment: ' + category] = text[index];
        if (layout) metrics['Layout alignment: ' + category] = layout[index];
      });
      if (layout) metrics.layout = mean(layout);
      return { model, score: mean(text), metrics };
    }), 5);
  },
};
export default board;
