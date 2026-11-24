// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// BabelArena tests agents in 23 languages. The README reports pass rates and language consistency for three trials.
import type { BoardPart, Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/QwenLM/BabelArena/HEAD/README.md';
const families = ['VitaBench', 'DeepPlanning', 'τ³-Bench', 'ClawEval'];
const levels = ['High', 'Medium', 'Low'];
const measures = ['Pass^1', 'Pass^3', 'LC'];

function readGroup(text: string, title: string, names: string[]) {
  const section = text.split('**' + title + '**')[1]?.trim().split('\n\n')[0];
  const lines = section?.split('\n');
  const cells = (line: string) => line.trim().slice(1,-1).split('|').map(s => s.replaceAll('**', '').trim());
  const expected = ['Model', ...names.flatMap(name => measures.map((m,i) => (i ? '' : name) + '<br>' + m))];
  if (!lines || JSON.stringify(cells(lines[0])) !== JSON.stringify(expected)) throw new Error('Missing ' + title);
  return new Map(lines.slice(2).map(line => {
    const [model, ...values] = cells(line);
    if (values.length !== expected.length - 1 || values.some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid ' + model);
    return [model, Object.fromEntries(values.map((v,i) => [names[Math.floor(i/3)] + measures[i%3], Number(v)]))];
  }));
}
const parts: Record<string, BoardPart> = {};
for (const name of [...families, ...levels]) {
  for (const measure of measures) parts[name + measure] = { name: name + ' ' + measure, unit: '%', group: families.includes(name) ? 'Benchmark family' : 'Language resource level' };
}
const board: Leaderboard = {
  benchmark: 'babelarena', url: 'https://github.com/QwenLM/BabelArena#-main-results', feed, parts,
  terms: 'Apache 2.0: https://github.com/QwenLM/BabelArena/blob/main/LICENSE',
  headline: 'The README reports no overall score, so this is the plain mean of Pass^1 across four benchmark families.',
  async fetch() {
    const text = await fetchText(feed);
    const byFamily = readGroup(text, 'By benchmark family', families);
    const byLevel = readGroup(text, 'By language resource level', levels);
    return checked([...byFamily].map(([model, scores]) => {
      if (!byLevel.has(model)) throw new Error('Missing resource levels for ' + model);
      const score = families.reduce((sum, name) => sum + scores[name + 'Pass^1'], 0) / families.length;
      return { model, score, trials: 3, metrics: { ...scores, ...byLevel.get(model) } };
    }), 5);
  },
};
export default board;
