// ComplexBench tests Chinese instructions with multiple interacting constraints.
// Table 5 gives the overall Decomposed Requirements Following Ratio as a fraction.
// We report it as a percentage and join the constraint and task results from Tables 22 and 23.
import type { Leaderboard, BoardPart } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2407.03978';
const taskNames = ['Fundamental Language Ability','Advanced Chinese Understanding','Open-ended Questions','Practical Writing','Creative Writing','Professional Writing','Custom Writing','Task-oriented Role Play','Professional Knowledge','Logical Reasoning'];
const board: Leaderboard = {
  benchmark:'complexbench',static:'paper',url,feed:url,terms:'Author results and license at https://arxiv.org/abs/2407.03978.',
  aliases:{'Llama-3-8B-Instruct':'llama-3-8b','Llama-3-70B-Instruct':'llama-3-70b','GPT-4-1106':'gpt-4-turbo-nov-2023','GPT-3.5-Turbo-1106':'gpt-3-5-turbo-nov-2023','ChatGLM3-6B-Chat':'chatglm3-6b'},
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const main = tables.find(t=>t[0]?.[0]==='Category' && t[0].at(-1)==='All' && t[1]?.[0]==='Nesting Depth');
    const tasks = tables.find(t=>t[0]?.join('|')==='Task Type|Fund.|Chi.|Open.|Prac.|Crea.|Pro. Writing|Cust.|Role.|Pro. Knowledge|Logic.|Overall');
    const constraints = tables.find(t=>t[1]?.[1]==='M0' && t[1]?.at(-2)==='M14');
    if (!main || !tasks || !constraints) throw new Error('Missing ComplexBench result tables');
    const cols = main[0].slice(1,-1).map((name,i) => name+': '+main[1][i+1].replace('\\geq 3','3 or more').replace('Avg.','Average'));
    const parts: Record<string,BoardPart> = {};
    const rows = main.slice(2).filter(c=>c[0]!==c[1]).map((c,i)=>{
      const model=c[0], score=numberCell(c.at(-1)!)*100;
      const task=tasks.find(x=>x[0]===model);
      if (!task || numberCell(task.at(-1)!)*100 !== score || !constraints[0][0].includes('(M'+i+') '+model)) throw new Error('Unmatched ComplexBench model '+model);
      const metrics:Record<string,number>={};
      function add(name:string,group:string,cell:string) {
        const key=group+': '+name;
        metrics[key]=numberCell(cell)*100;
        parts[key]={name,group};
      }
      cols.forEach((name,j)=>add(name,'Composition and depth',c[j+1]));
      taskNames.forEach((name,j)=>add(name,'Task',task[j+1]));
      let group='';
      for(const row of constraints!.slice(2)) {
        if(row[0]===row[1]) {group=row[0].replace('Utillity','Utility');continue;}
        add(row[0]==='Avg.'?'Average':row[0],group,row[i+1]);
      }
      return {model,score,metrics};
    });
    board.parts=parts;
    return checked(rows,15);
  },
};
export default board;
