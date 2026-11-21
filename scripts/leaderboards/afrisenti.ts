// AfriSenti tests sentiment classification in African languages. Table 8 reports multilingual F1
// on the combined test set. Table 7 reports the monolingual accuracy average and its 12 language scores.
// The authors average both sets of results over five runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2023.emnlp-main.862.pdf';
const languages = {amh:'Amharic',arq:'Algerian Arabic',ary:'Moroccan Arabic',hau:'Hausa',ibo:'Igbo',kin:'Kinyarwanda',pcm:'Nigerian Pidgin',
  'pt-MZ':'Mozambican Portuguese',swa:'Swahili',tso:'Xitsonga',twi:'Twi',yor:'Yoruba'};
const models = ['AfriBERTa-large','XLM-R-base','AfroXLMR-base','mDeBERTaV3-base','XLM-T-base','XLM-R-large','AfroXLMR-large'];
const board:Leaderboard = {
  benchmark:'afrisenti',static:'paper',url:'https://aclanthology.org/2023.emnlp-main.862/',feed,
  terms:'The ACL Anthology publishes the paper at https://aclanthology.org/2023.emnlp-main.862/.',
  headline:'Multilingual training uses combined-test F1. Monolingual training uses the paper’s mean accuracy across 12 languages.',
  parts:Object.fromEntries(Object.entries(languages).map(([key,name])=>[key,{name,unit:'%'}])),
  async fetch() {
    const pdf=await pdfText(feed);
    const first=pdf.split('Table 7: Accuracy scores')[0].split('\f').at(-1)!;
    const second=pdf.split('Table 7: Accuracy scores')[1]?.split('Table 8: Multilingual')[0];
    if (!first.includes('mDeBERTa?') || !second?.match(/Model\s+F1/)) throw new Error('Missing Tables 7 or 8');
    const mono:LeaderboardRow[]=models.map(model=>({model,setting:'Monolingual training (accuracy)',trials:5,score:NaN,metrics:{}}));
    for (const key of [...Object.keys(languages),'AVG']) {
      const cells=first.split('\n').find(line=>line.trimStart().startsWith(key+' '))?.trim().split(/\s+/).slice(5);
      if (!cells || cells.length!==7 || cells.some(v=>!/^\d+\.\d+$/.test(v))) throw new Error('Missing '+key);
      cells.forEach((v,i)=>{if (key==='AVG') mono[i].score=Number(v); else mono[i].metrics![key]=Number(v);});
    }
    const multi=models.map(model=>{
      const line=second.split('\n').find(l=>new RegExp(model+'\\s+\\d+\\.\\d+\\s*$').test(l));
      if (!line) throw new Error('Missing multilingual result for '+model);
      return {model,setting:'Multilingual training (F1)',trials:5,score:Number(line.trim().split(/\s+/).at(-1))};
    });
    return checked([...multi,...mono],14);
  },
};
export default board;
