// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// EsBBQ tests Spanish bias-related question answering. Table 7 gives accuracy for ambiguous
// and disambiguated contexts in fractions. Its separate bias estimates stay in their original units.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const url = 'https://arxiv.org/html/2507.11216';
const board: Leaderboard = {
  benchmark: 'esbbq', static: 'paper', url, feed: url,
  terms: 'The paper and its license are available at https://arxiv.org/abs/2507.11216.',
  headline: 'The paper reports no overall accuracy, so this is the plain mean of ambiguous and disambiguated context accuracy.',
  parts: { ambiguous:'Ambiguous context accuracy', disambiguated:'Disambiguated context accuracy' },
  aliases: { 'Mistral-v0.3 7B base':'mistral-7b-v0-3', 'Gemma-3 1B base':'gemma-3-1b-pt', 'Gemma-3 4B base':'gemma-3-4b-pt', 'Gemma-3 12B base':'gemma-3-12b-pt',
    'Gemma-3 1B instruct':'gemma-3-1b','Gemma-3 4B instruct':'gemma-3-4b','Gemma-3 12B instruct':'gemma-3-12b',
    'Llama-3.1 8B instruct':'llama-3-1-8b','Qwen2.5 1.5B instruct':'qwen2-5-1-5b','Qwen2.5 3B instruct':'qwen2-5-3b','Qwen2.5 7B instruct':'qwen2-5-7b' },
  async fetch() {
    const html = await paperHtml(url);
    const figure = html.match(/<figure id="A8\.T7"[\s\S]*?<\/figure>/)?.[0];
    if (!figure || !figure.includes('EsBBQ')) throw new Error('Missing Spanish results');
    const [t] = inlinePaperTables(figure);
    if (t[0][3] !== 'Ambiguous Context' || t[0][6] !== 'Disambiguated Context' || t[1].slice(3).join(',') !== 'Acc,Bias,UB|Bias|,Acc,Bias,UB|Bias|') throw new Error('Table 7 headers changed');
    let family = '', size = '';
    return checked(t.slice(2).map(c => {
      if (c[0] && c[0] !== '[1pt/2.2pt]') family = c[0];
      if (c[1]) size = c[1];
      if (c.length !== 9 || !family || !/^\d+(\.\d+)?B$/.test(size) || !['base','ins.'].includes(c[2])) throw new Error('Invalid Table 7 model');
      const [amb,biasAmb,upperAmb,dis,biasDis,upperDis] = c.slice(3).map(numberCell);
      const versionedFamily = family === 'Mistral' ? 'Mistral-v0.3' : family === 'Tower' ? 'Tower-v0.1' : family;
      const model = [versionedFamily,size,c[2] === 'ins.' ? 'instruct':'base'].join(' ');
      return { model, params:parseFloat(size), setting:'Zero-shot', score:(amb+dis)*50,
        metrics:{ambiguous:amb*100, disambiguated:dis*100, biasAmb, upperAmb, biasDis, upperDis} };
    }),34);
  },
};
export default board;
