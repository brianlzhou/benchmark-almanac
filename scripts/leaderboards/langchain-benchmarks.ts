// LangChain's tool-use study reports a "weighted average" of questions answered correctly across four tasks.
// The suite also includes other evaluations. The headline covers only the tool-use experiment.
// Overall scores and four task charts were transcribed twice and compared. The error bars give approximate standard errors.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const base = 'https://cdn.prod.website-files.com/65c81e88c254bb0f97633a71/';
const charts = [
  ['69cbb074ee78c99c7a392b97_overall_perf_all-1.png','ab1cefaee6a3a5240091672fe3aeb0f2822b3ce1c25631aa1b2fd9c58880785a'],
  ['69cbb074ee78c99c7a392bd2_overall_perf_Tool-Usage---Typewriter--1-tool--2.svg','5b2e1902f1f0680a66d10bf1daef66e23123099ff1773b5f209bc2f53da57d8d'],
  ['69cbb074ee78c99c7a392bcf_overall_perf_Tool-Usage---Typewriter--26-tools-.svg','a3967157f3e1acdc9e7ae1e270d56a8028eab757ef6dd1d00017d9c665caf4e8'],
  ['69cbb074ee78c99c7a392b9d_overall_perf_Tool-Usage---Relational-Data.png','9f1a7f35172c476908315883fecfd339b6458d9e74b8a898ad15b3c45bb06ea5'],
  ['69cbb074ee78c99c7a392b9a_overall_perf_Multiverse-Math.png','f553eb53c0a674180251d35797c8fe430ee7220c57fb96b4d7ed3292336ef193'],
];
const board: Leaderboard = {
  benchmark:'langchain-benchmarks',url:'https://www.langchain.com/blog/benchmarking-agent-tool-use',feed:base+charts[0][0],
  terms:'LangChain publishes these charts under the terms linked from https://www.langchain.com/blog/benchmarking-agent-tool-use.',
  headline:'The headline covers the four tool-use tasks in LangChain’s comparison, weighted by question count.',
  parts:{one:'Typewriter (1 tool)',many:'Typewriter (26 tools)',data:'Relational Data',math:'Multiverse Math'},
  stats:{stderr:{name:'Approximate standard error',unit:'%'}},
  aliases:{'gpt-3.5-turbo-0613':'gpt-3-5-turbo-jun-2023','gpt-3.5-turbo-1106':'gpt-3-5-turbo-nov-2023','gpt-4-0613':'gpt-4-jun-2023','gpt-4-1106-preview':'gpt-4-turbo-nov-2023','mixtral-8x7b-instruct':'mixtral-8x7b'},
  async fetch() {
    for (const [i,[path,hash]] of charts.entries()) {
      if (i) await new Promise(resolve => setTimeout(resolve,1000));
      await chartRows(base+path,hash,[]);
    }
    const data: [string,number,number,number,number,number,number][] = [
      ['mistral-7b-instruct-v0.1',20,5,5,19,50,4.4],
      ['mixtral-8x7b-instruct',44,60,60,38,20,5.5],
      ['claude-2.1',80,90,100,71,60,4.4],
      ['gpt-3.5-turbo-0613',72,85,50,81,70,5.0],
      ['gpt-3.5-turbo-1106',60,95,25,71,50,5.5],
      ['gpt-4-0613',68,70,40,95,65,5.2],
      ['gpt-4-1106-preview',83,90,90,95,55,4.2],
    ];
    return checked(data.map(([model,score,one,many,data,math,stderr]) => ({
      model, score,setting:model.startsWith('gpt-')?'Functions':undefined,metrics:{one,many,data,math,stderr},
    })),7);
  },
};
export default board;
