// StrataBench tests oil and gas land-document classification, extraction and terminology.
// Collide says the three denominators are never averaged. Table 8 gives the first task, Classify.
// Table 10 gives separate Extract experiments for these models. Table 14 evaluates different encoders.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const dataset = 'https://huggingface.co/datasets/Collide-ai/stratabench-land-v2';
const feed = dataset + '/resolve/main/oilbench_landscape_1.pdf';
const protocols = ['R0 open', 'R1 types', 'R2 disambiguation', 'R3 overrides', 'R4 full'];
const extract = { natural: 'Extract: Natural', rulesOnly: 'Extract: Rules only', fieldsOnly: 'Extract: Fields only', full: 'Extract: Full' };
function table(pdf: string, caption: string, headers: RegExp, width: number) {
  const before = pdf.split(caption);
  if (before.length !== 2) throw new Error('Missing ' + caption);
  const block = before[0].split(headers).at(-1)!;
  if (block === before[0]) throw new Error('Missing score columns');
  const models = new Map<string, number[]>();
  for (const line of block.trim().split('\n')) {
    const cells = line.trim().split(/\s{2,}/);
    if (cells.length !== width+1 || !cells.slice(1).every(c => /^\.\d{3}$/.test(c))) throw new Error('Unexpected model scores');
    models.set(cells[0], cells.slice(1).map(Number));
  }
  return models;
}
const board: Leaderboard = {
  benchmark: 'stratabench-land-v1', url: dataset + '#what-changed-from-v1', feed, static: 'paper',
  terms: 'CC BY-NC 4.0 with permission to publish attributed benchmark scores. ' + dataset + '/blob/main/LICENSE',
  headline: 'The headline is Classify accuracy on 66 instruments under the named prompt, on a scale from 0 to 1.',
  parts: { classify: {name: 'Classify', unit: 'score'}, ...Object.fromEntries(Object.entries(extract).map(([key,name]) =>
    [key, {name, unit: 'score' as const, note: 'Separate Extract experiment on ten common fields across 628 instruments.'}])) },
  async fetch() {
    const pdf = await pdfText(feed);
    const classify = table(pdf, 'Table 8: Accuracy on the same 66 instruments', /Model\s+R0 open\s+R1 types\s+R2 disambig\.\s+R3 overrides\s+R4 full/, 5);
    const extraction = table(pdf, 'Table 10: Accuracy on the ten fields', /Model\s+Natural\s+Rules only\s+Fields only\s+Full/, 4);
    return checked([...classify].flatMap(([model, scores]) => {
      const fieldScores = extraction.get(model);
      if (!fieldScores) throw new Error('Missing Extract results for ' + model);
      const metrics = Object.fromEntries(Object.keys(extract).map((key,i) => [key, fieldScores[i]]));
      return scores.map((score,i) => ({ model, score, setting: protocols[i], metrics: { classify: score, ...metrics } }));
    }), 25);
  },
};
export default board;
