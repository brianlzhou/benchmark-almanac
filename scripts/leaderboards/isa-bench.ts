// ISA-Bench tests program synthesis in five instruction-set puzzles. Table 4 ranks models by total tasks solved within five attempts with feedback.
// The headline converts that total to a percentage of all 92 tasks. First-attempt scores accompany it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.22878';
const tasks=['HRM','SIC-1','TIS','MHRD','BOX'];
const board: Leaderboard = {
  benchmark: 'isa-bench', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2609.22878",
  aliases:{'Phi-4 14B':'phi-4','DeepSeek-R1 32B':'deepseek-r1-distill-qwen-32b','Qwen3-Coder 30B':'qwen3-coder-30b-a3b-instruct'},
  parts:Object.fromEntries(tasks.flatMap(k=>['solve@1','solve@5'].map(m=>[k+' '+m,{name:k+' '+m,unit:'%' as const}]))),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table=tables.find(t=>t[0]?.join('|')===['Model','T',...tasks,'Total'].join('|'));
    if(!table || table[1].slice(2).join('|')!=='(36)|(31)|(7)|(8)|(10)|(92)') throw new Error('Missing solved-task columns');
    const counts=[36,31,7,8,10,92];
    const rows:LeaderboardRow[]=table.slice(2).map(([model,,...results])=>{
      if(results.length!==6) throw new Error('Missing environment score');
      const metrics:Record<string,number>={};
      let score=0;
      results.forEach((s,i)=>{
        const m=s.match(/^(\d+)\/(\d+)$/);
        if(!m) throw new Error('Invalid solve counts');
        const first=100*Number(m[1])/counts[i],fifth=100*Number(m[2])/counts[i];
        if(i<tasks.length){metrics[tasks[i]+' solve@1']=first;metrics[tasks[i]+' solve@5']=fifth;}
        else{metrics.solveAt1=first;metrics.solvedAt5=Number(m[2]);score=fifth;}
      });
      return {model,score,metrics,setting:'Up to five attempts with execution feedback'};
    });
    return checked(rows,14);
  },
};
export default board;
