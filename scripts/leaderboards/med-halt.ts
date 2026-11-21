// The source reports no overall score. The headline is the plain mean of the 7 parts, computed by this importer.
// Med-HALT tests medical reasoning and information retrieval. Tables 2 and 3 report accuracy and pointwise scores.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2023.conll-1.21.pdf';
const groups = [
  { label: 'Reasoning', end: 'Table 2: Evaluation results', tasks: ['Reasoning FCT','Reasoning Fake','Reasoning Nota'] },
  { label: 'Memory', end: 'Table 3: Evaluation results', tasks: ['IR Pmid2Title','IR Title2Pubmedlink','IR Abstract2Pubmedlink','IR Pubmedlink2Title'] },
];
const board: Leaderboard = {
  benchmark: 'med-halt', static: 'paper', feed, url: 'https://aclanthology.org/2023.conll-1.21/',
  aliases: { 'Text-Davinci': 'davinci-003' },
  terms: 'The ACL Anthology publishes the paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  headline: 'The headline is the unweighted mean of accuracy across the three reasoning tests and four memory tests.',
  parts: Object.fromEntries(groups.flatMap(g => g.tasks.map(name => [name.replaceAll(' ', ''), { name, group: g.label }]))),
  async fetch() {
    const paper = await pdfText(feed);
    const models = new Map<string, Record<string,number>>();
    for (const {label, end, tasks} of groups) {
      const section = paper.split(end)[0].split('\f').at(-1)!.trim().split('\n');
      if (!tasks.every(t => section[0].includes(t)) || !section[1].includes('Accuracy')) throw new Error('Missing ' + label + ' columns');
      for (const line of section.slice(2).filter(line => line.trim())) {
        const cells = line.trim().split(/\s+/);
        const values = cells.splice(-(tasks.length+1)*2).map(Number);
        if (values.length !== (tasks.length+1)*2 || !values.every(Number.isFinite) || !cells.length) throw new Error('Invalid ' + label + ' result');
        const model = cells.join(' ');
        const metrics = models.get(model) ?? {};
        [...tasks, label + 'Average'].forEach((name,i) => {
          const key = name.replaceAll(' ', '');
          metrics[key] = values[2*i];
          metrics[key + 'Pointwise'] = values[2*i+1];
        });
        models.set(model, metrics);
      }
    }
    const keys = Object.keys(board.parts!);
    return checked([...models].flatMap(([model, metrics]) => keys.every(k => k in metrics)
      ? [{ model, metrics, score: keys.reduce((sum,k) => sum + metrics[k],0) / keys.length }] : []), 12);
  },
};
export default board;
