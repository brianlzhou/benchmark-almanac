// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// GutBrainIE evaluates named entities, links and relations in biomedical abstracts.
// The official rankings use micro F1. The overview describes the component models of these four complete pipelines.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed='https://hereditary.dei.unipd.it/challenges/gutbrainie/2026/';
const parts={ner:'NER',nerd:'NERD',mention:'Mention-level RE',concept:'Concept-level RE'};
const systems=[
  {submitter:'Organizers',run:'BASELINE',models:['NuNERZero','PubMedBERT','ATLOP']},
  {submitter:'TEXA',run:'1',models:['GLiNER','ATLOP']},
  {submitter:'GetGut@AAU',run:'1',models:['GLiNER','SapBERT','BiomedBERT-large']},
  {submitter:'GutHub',run:'01',models:['XGBoost','GLiNER','PubMedBERT','BioLinkBERT','BioELECTRA','BioClinical ModernBERT','OpenMed-NER','SapBERT']},
];
const board:Leaderboard={
  benchmark:'gutbrainie-2026',url:feed+'#six',feed,parts,harnesses:'system',
  terms:'The CLEF organizers publish the rankings at https://hereditary.dei.unipd.it/challenges/gutbrainie/2026/ and describe the systems at https://ceur-ws.org/Vol-4283/paper5.pdf.',
  async fetch(){
    const html=await fetchText(feed);
    const rankings=tables(html).filter(t=>t[0]?.map(c=>c.text).join('|')==='Team ID|Run ID|Macro-P|Macro-R|Macro-F1|Micro-P|Micro-R|Micro-F1');
    if(rankings.length!==4)throw new Error('Missing subtask leaderboards');
    const rows=systems.map(({submitter,run,models})=>{
      const metrics:Record<string,number>={};
      for(const [i,key] of Object.keys(parts).entries()){
        const row=rankings[i].find(r=>r[0].text===submitter && r[1].text===run);
        if(!row || row.length!==8)throw new Error('Missing '+key+' for '+submitter);
        const names=['MacroP','MacroR','MacroF1','MicroP','MicroR',''];
        row.slice(2).forEach((c,j)=>{
          if(!/^(0(?:\.\d+)?|1(?:\.0+)?)$/.test(c.text))throw new Error('Invalid subtask metric');
          metrics[key+names[j]]=Number(c.text);
        });
      }
      return {model:models[0],models,harness:submitter+' '+run,submitter,score:Object.keys(parts).reduce((sum,k)=>sum+metrics[k],0)/4,metrics};
    });
    return checked(rows,4);
  },
};
export default board;
