// LMentry tests elementary language tasks. Its score multiplies accuracy by average robustness.
// Table 2 supplies the headline and both factors. Appendix B supplies accuracy on all 25 tasks.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2023.findings-acl.666.pdf';
const groups = [
  ['sentence containing', 'sentence not containing', 'word containing', 'word not containing', 'most associated word',
    'least associated word', 'any words from category', 'all words from category', 'first alphabetically',
    'more letters', 'less letters', 'bigger number', 'smaller number'],
  ['rhyming word', 'homophones', 'word after', 'word before', 'starts with word', 'ends with word',
    'starts with letter', 'ends with letter', 'first word', 'last word', 'first letter', 'last letter'],
];
const board: Leaderboard = {
  benchmark: 'lmentry', static: 'paper', feed, url: 'https://aclanthology.org/2023.findings-acl.666/',
  terms: 'The ACL Anthology publishes the paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  stats: { accuracy: { name: 'Accuracy', unit: '%', better: 'higher' }, robustness: { name: 'Robustness', unit: '%', better: 'higher', note: 'Average robustness across the LMentry tasks.' } },
  aliases: { 'GPT-3 0.35B': 'gpt-3-medium', 'GPT-3 1.3B': 'gpt-3-xl-babbage',
    'GPT-3 6.7B': 'gpt-3-6-7b', 'GPT-3 175B': 'gpt-3-175b-davinci', 'InstructGPT 0.35B': 'instructgpt-350m',
    'InstructGPT 6.7B': 'instructgpt-6b', TextDavinci002: 'davinci-002' },
  parts: Object.fromEntries(groups.flat().map(name => [name.replaceAll(' ', '_'), name])),
  async fetch() {
    const paper = await pdfText(feed);
    const main = paper.split('Table 2: The LMentry scores')[0].split('\f').at(-1)!;
    if (!/Accuracy\s+Robustness/.test(main)) throw new Error('Missing Table 2 columns');
    const appendix = paper.split(/\fB\s+Task-Level Results/)[1];
    if (!appendix) throw new Error('Missing Appendix B');
    const tables = [appendix.split('Table 34:')[0], appendix.split('Table 34:')[1]?.split('Table 35:')[0]];
    const rows = Array.from(main.matchAll(/(?:^| {2,})((?:T5-LM|T0p{0,2}|Tk-[a-z]+|GPT-3|InstructGPT) [\d.]+B|TextDavinci002) +(\d+\.\d+) +(\d+\.\d+) +(\d+\.\d+) *$/gm),
      ([, model, score, accuracy, robustness]) => {
        const metrics: Record<string, number> = { accuracy: Number(accuracy), robustness: Number(robustness) };
        groups.forEach((names, i) => {
          const table = tables[i];
          if (!table || !names.every(name => table.includes(name))) throw new Error('Missing Appendix B columns');
          const line = table.split('\n').map(s => s.trim()).find(s => s.startsWith(model + ' '));
          const cells = line?.slice(model.length).trim().split(/\s+/).map(Number);
          if (cells?.length !== names.length || !cells.every(Number.isFinite)) throw new Error('Invalid task scores for ' + model);
          names.forEach((name, j) => metrics[name.replaceAll(' ', '_')] = cells[j]);
        });
        return { model, score: Number(score), metrics };
      });
    return checked(rows, 16);
  },
};
export default board;
