// HackSynth OverTheWire measures the percentage of 80 challenges a model completes with HackSynth.
// Table I reports the overall completion rate, four category rates and the time in minutes.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2412.01778';
const categories = ['General (35)','Crypto (10)','Web (31)','Bin (4)'];
const board: Leaderboard = {
  benchmark:'hacksynth-overthewire', static:'paper', url:feed, feed, terms:PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts:Object.fromEntries(categories.map(name => [name,name])), stats:{minutes:{name:'Completion time',unit:'minutes',better:'lower'}}, reference:['HackSynth'],
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[9] === 'OverTheWire Benchmark' &&
      JSON.stringify(t[1]?.slice(9)) === JSON.stringify(['All (80)', ...categories, 'Speed']));
    if (!table) throw Error('Missing OverTheWire score columns');
    const rows = table.slice(2).map(r => {
      const values = r.slice(9,14).map(s => s.trim() ? Number(s) : NaN);
      const speed = /^(\d+)m$/.exec(r[14]);
      if (!values.every(Number.isFinite) || !speed) throw Error('Invalid scores for ' + r[0]);
      return {model:r[0], harness:'HackSynth', score:values[0],
        metrics:{ ...Object.fromEntries(categories.map((name,i) => [name,values[i+1]])),minutes:Number(speed[1]) }};
    });
    return checked(rows,8);
  },
};
export default board;
