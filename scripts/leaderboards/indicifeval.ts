// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 1 and 2 report loose accuracy for following instructions on translated and culturally grounded prompts.
// Each published average covers the 14 Indic languages and excludes English.
import type { Leaderboard } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables,grid,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2602.22125';
const languages=['as','bn','gu','hi','kn','ml','mr','ne','or','pa','sa','ta','te','ur'];
const parts=['IndicIFEval-Trans','IndicIFEval-Ground'];
const board:Leaderboard={
  benchmark:'indicifeval',static:'paper',url:feed,feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  headline:'The paper gives no combined score. The headline is the plain mean of translated and grounded prompt accuracy.',
  parts:Object.fromEntries(parts.flatMap((part,i)=>[part,...languages.map(l=>part+' '+l),...(i?[]:[part+' en'])].map(k=>[k,k]))),
  aliases:{'gemini/gemini-3-flash':'gemini-3-flash','gemini/gemini-3-pro':'gemini-3-pro',
    'openai/gpt-5-2025-08-07':'gpt-5','openai/gpt-5-mini-2025-08-07':'gpt-5-mini'},
  async fetch(){
    const gs=paperTables(await paperHtml(feed)).map(grid);
    const [trans,ground]=parts.map((_,i)=>gs.find(t=>t[0]?.join('|')===['Model',...languages,...(i?[]:['en']),'Avg'].join('|')));
    if(!trans || !ground) throw Error('Missing IndicIFEval language tables');
    const rows=ground.slice(1).filter(r=>r[0]!=='Avg').map(r=>{
      const tr=trans.find(c=>c[0]===r[0]);
      if(!tr) throw Error('Missing translated score for '+r[0]);
      const metrics:Record<string,number>={};
      for(const [i,cells] of [tr,r].entries()){
        const headers=i?ground[0]:trans[0];
        for(const [j,label] of headers.slice(1).entries()){
          const value=cells[j+1];
          if(!value?.trim() || !Number.isFinite(Number(value))) throw Error('Invalid '+label+' for '+r[0]);
          metrics[parts[i]+(label==='Avg'?'':' '+label)]=Number(value);
        }
      }
      return {model:r[0],score:(metrics[parts[0]]+metrics[parts[1]])/2,metrics};
    });
    return checked(rows,19);
  },
};
export default board;
