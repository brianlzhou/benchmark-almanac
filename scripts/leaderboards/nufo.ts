// Nufo evaluates Ewe speech recognition. Table 3 reports word and character error rates on
// 1,443 fixed test utterances under three training configurations. Full word error rate is the headline.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url='https://arxiv.org/html/2610.17278';
const training:Record<string,string>={W:'WAXAL','W+B':'WAXAL + BibleTTS','W+B+M':'WAXAL + BibleTTS + Common Voice Mina'};
const board:Leaderboard = {
  benchmark:'nufo',static:'paper',url,feed:url,terms:PAPER_TERMS,
  parts:{werNp:{name:'WER without punctuation',unit:'%',better:'lower'},
    werNpNd:{name:'WER without punctuation or diacritics',unit:'%',better:'lower'},
    cer:{name:'Full CER',unit:'%',better:'lower'},cerNpNd:{name:'CER without punctuation or diacritics',unit:'%',better:'lower'}},
  async fetch() {
    const t=flatPaperTables(await paperHtml(url)).map(grid).find(t => t[0].join('|') === 'Data|Model|WER|WER|WER|CER|CER' && t[1]?.join('|') === 'Data|Model|full|np|np_nd|full|np_nd');
    if (!t) throw new Error('Missing Nufo test error rates');
    let setting='';
    return checked(t.slice(2).map(([data,model,...cells]) => {
      if (data) setting=training[data];
      if (!setting || cells.length !== 5) throw new Error('Incomplete Nufo row');
      const [score,werNp,werNpNd,cer,cerNpNd]=cells.map(numberCell);
      return {model,setting,score,metrics:{werNp,werNpNd,cer,cerNpNd}};
    }),7);
  },
};
export default board;
