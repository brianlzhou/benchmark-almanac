// ANAH tests sentence-level hallucination detection in English and Chinese.
// Table 5 gives F1 on the whole test set. Tables 6 and A5 give split scores for the authors' generative annotators.
import type { Leaderboard } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables,grid,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2405.20315';
const measures = ['F1','Accuracy','ROUGE-L','4-gram precision','BERTScore'];
const splits = ['Unseen topic','Unseen question'];
const parts = Object.fromEntries(splits.flatMap(s=>measures.map(m=>[s+m,s+': '+m])));
const board: Leaderboard = {
  benchmark:'anah',url:feed,feed,static:'paper',terms:PAPER_TERMS,parts,
  async fetch() {
    const ts = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = ts.find(t=>t[0].map(c=>c.split(' ')[0]).join('|')==='Model|F1|ACC|R|BERT|Pre4');
    const detail = ts.find(t=>t[0].some(c=>c.startsWith('RougeL')) && t[1]?.slice(1).join('|')==='T|Q|T|Q|T|Q|T|Q');
    const bert = ts.find(t=>t[0].some(c=>c.startsWith('BERT')) && t[1]?.join('|')==='|T|Q');
    if (!main || !detail || !bert) throw new Error('Missing ANAH results columns');
    return checked(main.slice(1).map(([model,...cells])=>{
      if (cells.length!==5 || !cells.every(s=>/^\d+(\.\d+)?$/.test(s))) throw new Error('Invalid test score');
      const [score,accuracy,rougeL,bertScore,pre4] = cells.map(Number);
      const metrics:Record<string,number> = {accuracy,rougeL,bertScore,pre4};
      if (model.startsWith('ANAH-')) {
        const label = model.replace('ANAH-','G-');
        const row = detail.find(r=>r[0]===label), b = bert.find(r=>r[0]===label);
        if (!row || !b) throw new Error('Missing generalization scores for '+model);
        const scores = [...row.slice(1),...b.slice(1)].map(Number);
        measures.forEach((m,i)=>splits.forEach((s,j)=>{metrics[s+m] = scores[2*i+j];}));
      }
      return {model,score,metrics};
    }),14);
  },
};
export default board;
