// EndoVis18-VQA tests question answering about surgical scenes. Table 1 gives accuracy,
// recall and F-score for classification. Table 3 scores sentence generation with different metrics.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2206.11053';
const board:Leaderboard={
  benchmark:'endovis18-vqa',static:'paper',url,feed:url,terms:PAPER_TERMS,
  headline:'The headline is classification accuracy. The paper evaluates sentence generation separately, adding a transformer decoder to the VisualBert models.',
  parts:{recall:'Classification recall',f1:'Classification F-score',bleu3:{name:'Sentence BLEU-3',unit:'score'},
    bleu4:{name:'Sentence BLEU-4',unit:'score'},cider:{name:'Sentence CIDEr',unit:'score'},meteor:{name:'Sentence METEOR',unit:'score'}},
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid);
    const cls=ts.find(t=>t[1]?.join('|')==='Dataset|'+Array(3).fill('Acc|Recall|Fscore').join('|'));
    const gen=ts.find(t=>t[0]?.[1]==='EndoVis-18-VQA (S)' && t[1]?.slice(1,5).join('|')==='BLEU-3|BLEU-4|CIDEr|METEOR');
    const rates=cls?.find(r=>r[0]==='EndoVis-18-VQA (C)');
    if(!cls || !rates || !gen) throw new Error('Missing EndoVis18-VQA results');
    const rows=[1,4,7].map(i=>{
      const name=cls[0][i];
      const sentence=gen.find(r=>r[0]===name || r[0]===name+' + TD');
      if(!sentence) throw new Error('Missing sentence-generation scores for '+name);
      const cells=[...rates.slice(i,i+3),...sentence.slice(1,5)];
      if(cells.length!==7 || cells.some(v=>!/^\d+\.\d+$/.test(v))) throw new Error('Invalid EndoVis18-VQA result');
      const [acc,rec,f,bleu3,bleu4,cider,meteor]=cells.map(Number);
      return {model:name.replace(/\s*\[\s*\d+\s*\]/g,''),score:acc*100,metrics:{recall:rec*100,f1:f*100,bleu3,bleu4,cider,meteor}};
    });
    return checked(rows,3);
  },
};
export default board;
