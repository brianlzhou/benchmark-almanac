// K-BrowseComp tests Korean web research. Table 2 uses pass@1 on 300 verified questions as its headline.
// The paper reports the 100 synthetic questions as a separate diagnostic. Tables 3 and 5 give call usage and category accuracy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2606.02404';
const categories=Array.from({length:10},(_,i)=>'C'+(i+1));
const key=(name:string)=>name.toLowerCase().replace('hyperclovax','hcx');
const board: Leaderboard = {
  benchmark: 'k-browsecomp', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2606.02404",
  parts:{synthetic:{name:'Synthetic pass@1',unit:'%'},calibration:{name:'Calibration error',unit:'%',better:'lower'},
    ...Object.fromEntries(categories.map(name=>[name,{name,unit:'%' as const}]))},
  stats:{correctTrials:{name:'Correct-answer trials',unit:'count'},correctMeanCalls:{name:'Mean calls for correct answers',unit:'count',better:'lower'},wrongTrials:{name:'Wrong-answer trials',unit:'count'},wrongMeanCalls:{name:'Mean calls for wrong answers',unit:'count',better:'lower'}},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const t=tables.find(t=>t[0]?.includes('Synthetic subset') && t[1]?.[2]==='Pass@1 Acc.');
    const calls=tables.find(t=>t[0]?.[1]==='Correct n / avg. calls');
    const groups=tables.find(t=>t[0]?.[1]==='C1' && t[0]?.at(-1)==='Overall');
    if(!t || !calls || !groups)throw new Error('Missing K-BrowseComp results');
    const rows:LeaderboardRow[]=t.slice(2).filter(r=>r[2]!=='–').map(([model,access,acc,cal,syn])=>{
      const metrics:Record<string,number>={calibration:numberCell(cal)};
      if(!syn.startsWith('N/A'))metrics.synthetic=numberCell(syn);
      const g=groups.find(r=>key(r[0])===key(model)), usage=calls.find(r=>key(r[0])===key(model));
      if(!g || !usage)throw new Error('Missing category or usage data: '+model);
      categories.forEach((k,i)=>{metrics[k]=numberCell(g[i+1]);});
      for(const [i,label] of ['correct','wrong'].entries()){
        const [n,avg]=usage[i+1].split(' / ').map(numberCell);
        metrics[label+'Trials']=n;metrics[label+'MeanCalls']=avg;
      }
      return {model,score:numberCell(acc),open:access==='Open',metrics,setting:'Perplexity Search API, 10-call budget'};
    });
    return checked(rows,10);
  },
};
export default board;
