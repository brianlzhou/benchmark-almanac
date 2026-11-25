// Keystone-Eval measures how often an agent configures and runs a repository's tests.
// Figures 1 through 3 give completion and mutation-win rates and median cost and time.
// We compared two readings of the chart labels and guard all three source images by hash.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const base='https://cdn.sanity.io/images/dg1xe82e/production/';
const figures=[
  ['cc434eb44781d6732762a48a7a3b98f3065f6b70-1400x800.png','47f31f6d3cf6e73d63dd3bb5470aeccb08b61e1e40a231ef483366cd984cb04c'],
  ['94d3e34dbd1efc196060e7ad517a2f9457be7b92-1400x900.png','afb45191a090d3a3f0b6562ae6eca764a899fd47757c1e05e8d2510d26e91cb5'],
  ['115d917459342ab527af12f390c6c5f320a7ff3d-1400x900.png','4578bef0f9a204fbd9e1c37e4743115aac43df465ea5cfed941be5cb4f578841'],
];
const results:[string,string,number,number,number,number,number][]=[
  ['Claude Opus 4.6','Claude Code',93,58,0.99,11.6,191],['GPT-5.4','Codex',85,75,1.94,16.6,191],
  ['Claude Sonnet 4.5','Claude Code',81,54,0.74,13.7,192],['Codex GPT-5.3','Codex',75,54,0.95,7.4,191],
  ['Claude Haiku 4.5','Claude Code',72,42,0.37,15.5,195],['Codex Mini GPT-5.1','Codex',9,6,0.01,0.7,195],
];
const board:Leaderboard={
  benchmark:'keystone-eval',url:'https://imbue.com/blog/keystone-eval',feed:base+figures[0][0],
  terms:'Imbue publishes Figures 1 through 3 at https://imbue.com/blog/keystone-eval under its site terms.',
  aliases:{'Codex GPT-5.3':'gpt-5-3-codex','Codex Mini GPT-5.1':'gpt-5-1-codex-mini'},
  stats:{mutation:{name:'Mutation win rate',unit:'%',better:'higher'},
    medianTime:{name:'Median wall-clock time per repository',unit:'minutes',better:'lower'},repos:{name:'Repositories',unit:'count'}},
  async fetch(){
    for (const [path,hash] of figures) await chartRows(base+path,hash,[]);
    return checked(results.map(([model,harness,score,mutation,cost,medianTime,repos])=>
      ({model,harness,score,cost,metrics:{mutation,medianTime,repos}})),6);
  },
};
export default board;
