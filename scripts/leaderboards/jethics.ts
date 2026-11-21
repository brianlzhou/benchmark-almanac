// JETHICS tests ethical judgments in Japanese across seven categories. Table 3 reports the authors’ average in the 8-shot setting.
// The importer converts fractions to percentages and preserves the seven category results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.16187';
const parts=['Common-sense','Justice (Desert)','Justice (Impartiality)','Deontology (Request)','Deontology (Role)','Utilitarianism','Virtue Ethics'];
const names:Record<string,string>={'llmjp3.7b':'llm-jp-3-3.7b-instruct',llmjp13b:'llm-jp-3-13b-instruct','Meta-Llama8b':'Meta-Llama-3-8B-Instruct','Llama-ELYZA8b':'Llama-3-ELYZA-JP-8B','gpt-4o':'gpt-4o-2024-11-20','gpt-4o-mini':'gpt-4o-mini-2024-07-18'};
const params:Record<string,number>={'llm-jp-3-3.7b-instruct':3.7,'llm-jp-3-13b-instruct':13,'Meta-Llama-3-8B-Instruct':8,'Llama-3-ELYZA-JP-8B':8};
const board: Leaderboard = {
  benchmark: 'jethics', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2506.16187",
  aliases:{'gpt-4o-2024-11-20':'gpt-4o-nov-2024','gpt-4o-mini-2024-07-18':'gpt-4o-mini'},
  parts:Object.fromEntries(parts.map(name=>[name,{name,unit:'%' as const}])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const t=tables.find(t=>t[0]?.join('|')===['Model','Average',...parts].join('|'));
    if(!t) throw new Error('Missing JETHICS Table 3');
    const rows:LeaderboardRow[]=t.slice(1).filter(r=>r[0]!=='Random Baseline').map(([name,avg,...values])=>{
      if(values.length!==parts.length)throw new Error('Missing category');
      const model = names[name] ?? name;
      return {model,params:params[model],setting:'8-shot',score:100*numberCell(avg),
        metrics:Object.fromEntries(parts.map((k,i)=>[k,100*numberCell(values[i])]))};
    });
    return checked(rows,6);
  },
};
export default board;
