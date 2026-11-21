// CLadder tests causal reasoning with yes/no questions. Tables 2 and 6 report overall accuracy
// for versions 1.5 and 1.0, plus accuracy by causal rung and alignment with commonsense.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, flatPaperTables, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2312.04350';
const parts: Record<string,string> = {
  '1':'Rung 1','2':'Rung 2','3':'Rung 3','Comm.':'Commonsensical','Nonsens.':'Nonsensical','Anti-C.':'Anti-commonsensical',
};
const board: Leaderboard = {
  benchmark: 'cladder', url: feed, feed, static: 'paper',
  terms: 'Results credited to Zhijing Jin and colleagues. https://arxiv.org/abs/2312.04350',
  aliases: { LLaMa:'llama-7b','GPT-3 Non-Instr. (davinci)':'gpt-3-175b-davinci',
    'GPT-3 Instr. (text-davinci-002)':'davinci-002','GPT-3 Instr. (text-davinci-003)':'davinci-003',
    'GPT-4 (queried in May 2023)':'gpt-4-mar-2023','GPT-3.5 (queried in May 2023)':'gpt-3-5-turbo-mar-2023' },
  parts: Object.fromEntries(Object.values(parts).map(name=>[name,{name,unit:'%'}])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid).filter(t => t[0]?.[1] === 'Overall Acc.');
    const rows: LeaderboardRow[] = [];
    for (const t of tables) {
      const version = {'Acc. by Commonsense Alignment':'1.5','Acc. by Empirical Alignment':'1.0'}[t[0][5]];
      const keys = t[1].slice(2).map(k => parts[k]);
      if (!version || keys.length !== 6 || new Set(keys).size !== 6 || keys.some(k=>!k)) throw new Error('Missing CLadder columns');
      let model = '';
      for (const [label,score,...cells] of t.slice(2)) {
        if (label === 'Random') continue;
        const cot = label === '+ CausalCoT';
        if (!cot) model = label === 'GPT-4' && version === '1.5' ? 'gpt-4-1106-preview' : label;
        if ((cot && !/gpt-4/i.test(model)) || cells.length !== keys.length) throw new Error('Unexpected CLadder model row');
        rows.push({model, setting:'v' + version + ', ' + (cot ? 'CausalCoT' : 'Direct prompting'), score:numberCell(score),
          metrics:Object.fromEntries(keys.map((k,i)=>[k,numberCell(cells[i])]))});
      }
    }
    return checked(rows,18);
  },
};
export default board;
