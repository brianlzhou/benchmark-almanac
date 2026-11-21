// The source reports no overall score. The headline is the plain mean of the 11 parts, computed by this importer.
// Table 3 measures math accuracy with the revised questions and improved answer extraction for every language.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://aclanthology.org/2026.gem-main.22.pdf';
const languages = { en:'English', bn:'Bengali', de:'German', es:'Spanish', fr:'French', ja:'Japanese',
  ru:'Russian', sw:'Swahili', te:'Telugu', th:'Thai', zh:'Chinese' };
const board: Leaderboard = {
  benchmark: 'mgsm-rev2', static: 'paper', url: 'https://aclanthology.org/2026.gem-main.22/', feed,
  terms: 'The ACL Anthology publishes the paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  headline: 'The headline is the plain mean of accuracy across the 11 languages in the revised dataset.',
  parts: languages,
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.split('Table 3: Results using the improved data and answer extraction.')[1];
    const keys = Object.keys(languages);
    const block = section?.match(/^\s*(System\s+en\s+bn[^\n]+)\n([\s\S]*?)\n\s*\n/m);
    if (!block || block[1].trim().split(/\s+/).join('|') !== ['System', ...keys].join('|')) throw new Error('Missing revised results');
    return checked(block[2].trim().split('\n').map(line => {
      const cells = line.trim().split(/\s+/);
      const values = cells.splice(-keys.length).map(numberCell);
      if (values.length !== keys.length || !cells.length) throw new Error('Incomplete language scores');
      return { model: cells.join(' '), metrics: Object.fromEntries(keys.map((k,i) => [k,values[i]])),
        score: values.reduce((a,b) => a+b,0)/keys.length };
    }), 11);
  },
};
export default board;
