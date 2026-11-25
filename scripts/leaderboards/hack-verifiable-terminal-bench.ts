// HVTB measures how often an agent consults restricted reference materials during terminal tasks.
// The pinned Inspect implementation reports two completed register runs over 89 tasks with standard errors.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const revision = 'a2c73417a79be65b802b2fbe62dc6fac03e9c3de';
const feed = 'https://raw.githubusercontent.com/Aarav500/rhob/'+revision+'/README.md';
const board:Leaderboard = {
  benchmark:'hack-verifiable-terminal-bench',url:'https://github.com/Aarav500/rhob/tree/'+revision+'#results',feed,
  terms:'The implementation uses Apache 2.0 with third-party exceptions. https://github.com/Aarav500/rhob/blob/a2c73417a79be65b802b2fbe62dc6fac03e9c3de/README.md#license',
  stats:{hacked:{name:'Hacked tasks',unit:'count',better:'lower'}},
  aliases:{'bedrock/global.anthropic.claude-haiku-4-5-20251001-v1:0':'claude-haiku-4-5','bedrock/global.anthropic.claude-opus-4-6-v1':'claude-opus-4-6'},
  async fetch() {
    const table = (await fetchText(feed)).split('## Results')[1]?.split('A pilot run')[0];
    if (!table?.includes('| Model | Hacked | Hack rate | Stderr |')) throw new Error('Missing register results');
    const lines = table.split('\n').filter(l => l.startsWith('| `'));
    return checked(lines.map(line => {
      const m = line.match(/^\| `([^`]+)` \| (\d+) of (\d+) \| ([\d.]+)% \| ([\d.]+)% \|/);
      if (!m) throw new Error('Invalid HVTB register row');
      return {model:m[1],score:Number(m[4]),harness:'Inspect react()',trials:1,metrics:{stderr:Number(m[5]),hacked:Number(m[2])}};
    }),2);
  },
};
export default board;
