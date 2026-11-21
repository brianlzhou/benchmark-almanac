// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// The replication compares generated single-choice votes with survey responses. Its
// jaccard_overall.py divides exact matches by all rows, including noncandidate response codes.
import type { Leaderboard } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { readXlsx } from './superclue.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://github.com/TDI-Lab/Generative-AI-Voting';
const base = 'https://raw.githubusercontent.com/TDI-Lab/Generative-AI-Voting/HEAD/Gen_AI_Outputs/A21_GPT_LLAMA_PREDICTION_';
const years = ['2012','2016','2020'];
const board: Leaderboard = {
  benchmark:'anes-presidential-vote-choice',url,feed:base + '2012.xlsx',host:'TDI Lab',
  terms:'The replication authors publish their workbooks and scoring code on GitHub. ' + url,
  headline:'The replication gives no combined score, so this is the plain mean of exact agreement across three election years.',
  parts:Object.fromEntries(years.map(y => ['year'+y,y])),
  async fetch() {
    const rows = ['GPT 3.5','Llama 2'].map(model => ({model,score:0,metrics:{} as Record<string,number>}));
    for (const year of years) {
      if (year !== years[0]) await new Promise(resolve => setTimeout(resolve,1000));
      const table = readXlsx(Buffer.from(await fetchBytes(base + year + '.xlsx'))).values().next().value;
      if (!table) throw new Error('Missing election worksheet');
      const columns = ['A21_original','A21_GPT','A21_llama'].map(k => table[0].indexOf(k));
      if (columns.includes(-1)) throw new Error('Missing vote columns');
      const records = table.slice(1).filter(r => columns.some(i => r[i]?.trim()));
      if (!records.length) throw new Error('Empty election sample');
      rows.forEach((row,i) => {
        const matches = records.filter(r => r[columns[0]]?.trim() && r[columns[0]] === r[columns[i+1]]).length;
        const rate = matches * 100/records.length;
        row.metrics['year'+year] = rate;
        row.score += rate / years.length;
      });
    }
    return checked(rows,2);
  },
};
export default board;
