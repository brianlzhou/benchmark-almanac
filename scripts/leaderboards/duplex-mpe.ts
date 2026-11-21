// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// Duplex-MPE tests how a speech assistant participates in multi-party conversations. The project's
// results table distinguishes four scored capabilities from two coverage diagnostics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://step-out.github.io/Duplex-MPE-Page/';
const feed = url + 'data.js';
const columns = ['Fresh-onset response rate','Conditional answer accuracy','Silence preservation',
  'Answering-window yield','Response presence','Window response'];
type Result = {model: string; condition: string; values: number[]; yieldCount: number};
const board: Leaderboard = {
  benchmark: 'duplex-mpe', url, feed,
  terms: 'The project publishes the evaluation code under MIT. https://github.com/step-out/Duplex-MPE/blob/HEAD/LICENSE',
  headline: 'The site reports no overall score, so this is the plain mean of its four scored capabilities.',
  parts: Object.fromEntries(columns.slice(0,4).map(k => [k,k])),
  stats: {
    'Response presence': { name: 'Response presence', unit: '%', better: 'higher' },
    'Window response': { name: 'Window response', unit: '%', better: 'higher' },
    yieldEligibleEvents: { name: 'Yield-eligible events', unit: 'count' },
  },
  async fetch() {
    const page = await fetchText(url);
    const table = tables(page.replace(/<br\s*\/?>/gi,' ')).find(t => t[1]?.[0]?.text === 'Model');
    if (table?.[1].slice(1).map(c => c.text).join('|') !== columns.join('|')) throw new Error('Duplex-MPE table columns changed');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const file = await fetchText(feed);
    const match = file.match(/window\.DUPLEX_DATA\s*=\s*(\{[\s\S]*\});\s*$/);
    if (!match) throw new Error('Missing Duplex-MPE data');
    const data: {models: Record<string,string>; results: Result[]} = JSON.parse(match[1]);
    const rows = data.results.map(({model,condition,values,yieldCount}) => {
      if (!data.models[model] || !['explicit','implicit'].includes(condition) || values.length !== 6 ||
          !values.every(v => Number.isFinite(v) && v >= 0 && v <= 1) || !Number.isInteger(yieldCount)) throw new Error('Invalid Duplex-MPE result');
      const metrics = Object.fromEntries(columns.map((k,i) => [k,100 * values[i]]));
      metrics.yieldEligibleEvents = yieldCount;
      return {model: data.models[model], setting: condition + ' addressing', trials: 2000, metrics,
        score: values.slice(0,4).reduce((sum,value) => sum + value,0) * 25};
    });
    return checked(rows, 16);
  },
};
export default board;
