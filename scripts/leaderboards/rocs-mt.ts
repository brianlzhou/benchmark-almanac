// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// Table 3 measures reference-based COMET on raw and normalized English translated into four languages.
// The paper identifies GPT4 and the shared NLLB model behind two decoding strategies.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2023.wmt-1.21.pdf';
const langs=['en-cs','en-de','en-ru','en-uk'];
const keys=langs.flatMap(l=>['norm','raw'].map(v=>l+' '+v));
const board: Leaderboard = {
  benchmark:'rocs-mt',static:'paper',url:'https://aclanthology.org/2023.wmt-1.21/',feed,
  terms:'ACL Anthology publishes the paper and license at https://aclanthology.org/2023.wmt-1.21/.',
  parts:Object.fromEntries(keys.map(name=>[name,name])),
  stats:Object.fromEntries(langs.map(l=>[l+' difference',{name:l+' normalization difference',unit:'score'}])),
  headline:'The headline is the plain mean of reference-based COMET for four language pairs on raw and normalized text.',
  async fetch() {
    const pdf=await pdfText(feed);
    const table=pdf.match(/Systems\s+en-cs\s+en-de\s+en-ru\s+en-uk\s+((?:norm\s+raw\s+∆\s+){4})([\s\S]*?)Table 3: COMET scores/);
    if (!table) throw new Error('Missing Table 3 language or variant columns');
    const rows=[];
    for (const line of table[2].trim().split('\n')) {
      const [label,...values]=line.trim().split(/\s+/);
      if (!['GPT4-5shot','NLLB_MBR','NLLB_Greedy'].includes(label)) continue;
      if (values.length!==12 || values.some(v=>!/^\d+\.\d+$/.test(v))) throw new Error('Incomplete named model');
      const metrics:Record<string,number>={};
      langs.forEach((l,i)=>{
        metrics[l+' norm']=Number(values[3*i]);
        metrics[l+' raw']=Number(values[3*i+1]);
        metrics[l+' difference']=Number(values[3*i+2]);
      });
      rows.push({model:label.startsWith('GPT4')?'GPT4':'NLLB',
        setting:label.startsWith('GPT4')?'5-shot':label==='NLLB_MBR'?'MBR decoding':'Greedy decoding',
        score:keys.reduce((sum,k)=>sum+metrics[k],0)/8,metrics});
    }
    return checked(rows,3);
  },
};
export default board;
