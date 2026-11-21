// DSCodeBench tests whether generated data science code passes execution tests.
// Tables 2 and 4 report pass@1 and pass@3 across 1,000 problems. Tables 3 and 6 give library results.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const url='https://arxiv.org/html/2505.15621';
const libraries=['NumPy','Pandas','Scipy','Scikit-learn','Matplotlib','Seaborn','TensorFlow','PyTorch','Keras','LightGBM'];
function percent(s:string) {
  if(!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(s)) throw new Error('Invalid DSCodeBench rate '+s);
  return Number(s)*100;
}
const board: Leaderboard = {
  benchmark:'dscodebench',static:'paper',url,feed:url,terms:PAPER_TERMS,
  aliases:{'DeepSeek-Coder-V2-Lite-Instruct(15.7B)':'deepseek-coder-v2-lite-instruct'},
  parts:Object.fromEntries(libraries.map(k=>[k,k])),
  stats: {
    passAt3: { name: 'Pass@3', unit: '%', better: 'higher' },
    correct: { name: 'Average correct count', unit: 'count' },
    partiallyCorrect: { name: 'Average partially correct count', unit: 'count' },
    wrong: { name: 'Average wrong count', unit: 'count' },
  },
  async fetch(){
    const html=await paperHtml(url);
    const ts=paperTables(html).map(grid);
    const base=ts.find(t=>t[0]?.join('|')==='Benchmark|Model|Pass@1|Pass@3|Avg. Correct|Avg. Partially Correct|Avg. Wrong');
    const hot=ts.find(t=>t[0]?.join('|')==='Temperature|Model|pass@1|pass@3|Avg. count_correct|Avg. count_part_correct|Avg. count_wrong');
    const splits=['Sx4.T3','Sx8.T6'].map(id=>grid(paperTables(html.split('<figure id="'+id+'"')[1]?.split('</figure>')[0]??'')[0]??[]));
    if(!base || !hot || splits.some(t=>t[0]?.join('|')!==['Model',...libraries].join('|'))) throw new Error('Missing DSCodeBench tables');
    const results=[...base.filter(r=>r[0]==='DSCodeBench').map(([, ...r])=>['0.2',...r]),...hot.filter(r=>r[0]==='0.6')];
    const rows=results.map(([temp,model,p1,p3,...counts])=>{
      const split=splits[temp==='0.2'?0:1].find(r=>r[0]===model);
      if(!split || counts.length!==3) throw new Error('Missing DSCodeBench model results');
      const metrics:Record<string,number>={passAt3:percent(p3)};
      libraries.forEach((key,i)=>{metrics[key]=percent(split[i+1]);});
      ['correct','partiallyCorrect','wrong'].forEach((key,i)=>{
        const m=counts[i].match(/^(\d+(?:\.\d+)?)\s*\\pm\s*(\d+(?:\.\d+)?)$/);
        if(!m) throw new Error('Missing count and deviation for '+model);
        metrics[key]=Number(m[1]);metrics[key+'Std']=Number(m[2]);
      });
      return {model,setting:'Temperature '+temp,score:percent(p1),metrics};
    });
    return checked(rows,17);
  },
};
export default board;

