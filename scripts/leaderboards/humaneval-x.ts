// HumanEval-X tests code generation in five languages. Table 5 reports language-averaged pass@1, pass@10 and pass@100.
// The headline is the reported average probability that a single generated solution passes the tests.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2303.17568';
const languages=['Python','C++','Java','JavaScript','Go'];
const board: Leaderboard = {
  benchmark:'humaneval-x',static:'paper',url:feed,feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  parts:Object.fromEntries(languages.map(k=>[k,k])),
  stats: {
    passAt1: { name: 'pass@1', unit: '%', better: 'higher' },
    passAt10: { name: 'pass@10', unit: '%', better: 'higher' },
    passAt100: { name: 'pass@100', unit: '%', better: 'higher' },
    ...Object.fromEntries(languages.flatMap(lang => [10, 100].map(k => [lang + 'PassAt' + k, { name: lang + ' pass@' + k, unit: '%', better: 'higher' }]))),
  },
  async fetch() {
    const t=flatPaperTables(await paperHtml(feed)).map(grid).find(t=>t[0]?.[0]==='Language' && t[0]?.[1]==='Metric' && t.at(-1)?.[0]==='Average');
    if (!t) throw Error('Missing multilingual generation results');
    const rows=t[0].slice(2).map((label,i)=>{
      const model=label.replace(/\s+-/g,'-').replace(' (ours)','');
      const metrics:Record<string,number>={};
      for (const lang of [...languages,'Average']) {
        for(const k of [1,10,100]) {
          const value=t.find(r=>r[0]===lang && r[1]==='pass@'+k)?.[i+2];
          if(!value || !/^\d+(\.\d+)?%$/.test(value)) throw Error('Missing '+lang+' pass@'+k);
          const key=lang==='Average'?'passAt'+k:k===1?lang:lang+'PassAt'+k;
          metrics[key]=parseFloat(value);
        }
      }
      return {model, setting:'Code generation',score:metrics.passAt1,trials:200,metrics};
    });
    return checked(rows,6);
  },
};
export default board;
