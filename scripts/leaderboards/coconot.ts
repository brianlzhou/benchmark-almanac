// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// CoCoNot tests whether assistants comply with unsuitable requests. Table 10 gives compliance rates with and without a system prompt.
// Contrast-set compliance has the opposite direction and is kept separately.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2407.12043';
const categories = ['Incomplete','Unsupported','Indeterminate','Safety','Humanizing'];
const board: Leaderboard = {
  benchmark: 'coconot', static: 'paper', feed, url: feed,
  terms: 'The authors make the benchmark available at https://github.com/allenai/noncompliance/blob/main/LICENSE.',
  headline: 'The paper reports no overall rate, so this is the plain mean of the five original request categories.',
  parts: {...Object.fromEntries(categories.map(c => [c,c])), contrast: {name:'Contrast set',unit:'%',better:'higher'}},
  aliases: { 'Mistral':'mistral-7b-instruct-v0-2', 'Tulu-2-70b-dpo':'tulu-2-dpo-70b' },
  async fetch() {
    const html = await paperHtml(feed);
    const figure = Array.from(html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g),m => m[0]).find(f => /Table 10:\s*<\/span>/.test(f));
    const table = figure && paperTables(figure)[0];
    if (!table) throw new Error('Missing Table 10');
    const [header,...data] = grid(table);
    if (header.slice(1,6).join() !== categories.join() || !header[6]?.startsWith('Contrast Set')) throw new Error('Missing compliance columns');
    const rows = data.flatMap(([model,...cells]) => {
      const pairs = cells.map(c => c.split('/').map(x => x.trim()));
      if (pairs.length !== 6 || pairs.some(p => p.length !== 2 || p.some(v => !/^\d+(?:\.\d+)?$/.test(v)))) throw new Error('Invalid paired compliance rates');
      return ['Without system prompt','With system prompt'].map((setting,i) => {
        const metrics = Object.fromEntries([...categories,'contrast'].map((k,j) => [k,Number(pairs[j][i])]));
        return {model, setting, score: categories.reduce((s,k) => s+metrics[k],0)/5, metrics};
      });
    });
    return checked(rows,40);
  },
};
export default board;
