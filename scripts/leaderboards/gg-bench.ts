// gg-bench tests play in generated games against reinforcement learning agents.
// The README reports mean win rate across games with 95% confidence intervals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/vivek3141/gg-bench/master/README.md';
const board:Leaderboard = {
  benchmark:'gg-bench',url:'https://github.com/vivek3141/gg-bench#results',feed,
  terms:'The repository uses the MIT License. https://github.com/vivek3141/gg-bench/blob/master/LICENSE',
  stats:{gamesPerEnvironment:{name:'Games per environment',unit:'count'}},
  aliases:{'meta-llama-3.3-70B':'llama-3-3-70b'},
  async fetch() {
    const section = (await fetchText(feed)).split('## Results')[1]?.split('## Citing')[0];
    if (!section?.includes('Benchmark Score') || !section.includes('95% confidence interval')) throw new Error('Missing gg-bench results');
    const lines = section.split('\n').filter(l => l.startsWith('|')).slice(2);
    return checked(lines.map(line => {
      const m = line.replaceAll('*','').match(/^\|\s*([^|]+?)\s*\|\s*([\d.]+)\s*\(±\s*([\d.]+)\)\s*\|/);
      if (!m) throw new Error('Invalid benchmark score: '+line);
      const score = Number(m[2]), margin = Number(m[3]);
      return {model:m[1],score,low:Number((score-margin).toFixed(2)),high:Number((score+margin).toFixed(2)),metrics:{gamesPerEnvironment:30}};
    }),7);
  },
};
export default board;
