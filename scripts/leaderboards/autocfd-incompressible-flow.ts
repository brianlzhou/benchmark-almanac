// AutoCFD evaluates solution accuracy on 21 incompressible flow cases. The authors'
// benchmark comparison chart gives accuracy, pass@1, iterations, and tokens in units of 10,000.
// Two transcriptions of the chart labels agreed. The SHA-256 check detects image changes.
// The paper identifies MetaOpenFOAM's model and reports the cost per simulation.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/YYgroup/AutoCFD/HEAD/assets/baseline-bar.png';
const board: Leaderboard = {
  benchmark:'autocfd-incompressible-flow',static:'paper',url:'https://github.com/YYgroup/AutoCFD',feed,
  terms:'The authors publish this comparison figure and credit the work to the AutoCFD team. https://github.com/YYgroup/AutoCFD',
  stats:{passAt1:{name:'Pass at 1',unit:'%',better:'higher'},steps:{name:'Steps',unit:'count',better:'lower'},totalTokens:{name:'Total tokens',unit:'tokens'}},
  aliases:{'Qwen2.5-72B-Instruct':'qwen2-5-72b','Llama3.3-70B-Instruct':'llama-3-3-70b'},
  async fetch() {
    const rows = await chartRows(feed,'17c5214413ac39e8292da4809ef6cf88776e7a2cb2bc7257c45b6427a252d4fb',[
      {model:'AutoCFD-7B',harness:'AutoCFD',score:88.7,cost:0.020,metrics:{passAt1:82.6,steps:2.6,totalTokens:17816}},
      {model:'GPT-4o',harness:'MetaOpenFOAM',score:9.5,cost:0.227,metrics:{passAt1:2.9,steps:9.8,totalTokens:68000}},
      {model:'Qwen2.5-72B-Instruct',harness:'AutoCFD',score:31.4,cost:0.035,metrics:{passAt1:47.1,steps:7.2,totalTokens:36000}},
      {model:'DeepSeek-R1',harness:'AutoCFD',score:41.7,cost:0.042,metrics:{passAt1:22.4,steps:8.3,totalTokens:52000}},
      {model:'Llama3.3-70B-Instruct',harness:'AutoCFD',score:4.7,cost:0.018,metrics:{passAt1:0.5,steps:9.9,totalTokens:32000}},
    ]);
    return checked(rows,5);
  },
};
export default board;
