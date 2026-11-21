// GovReport tests summarization of long government reports. Table 4 gives ROUGE
// for BART attention variants trained under the same hardware budget. ROUGE-1
// is the paper's first metric. Preserve ROUGE-2 and ROUGE-L alongside it.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2021.naacl-main.112.pdf';
export default {
  benchmark:'govreport',url:'https://aclanthology.org/2021.naacl-main.112/',feed,static:'paper',
  terms:'ACL Anthology licensing terms at https://aclanthology.org/faq/copyright/',
  headline:'The headline is ROUGE-1 on the GovReport test split.',
  parts:{rouge2:'ROUGE-2',rougeL:'ROUGE-L'},
  async fetch() {
    const paper=await pdfText(feed);
    const page=paper.split('Table 4: ROUGE scores for models trained on the same')[0].split('\f').at(-1)!;
    if (!/GovReport\s+PubMed\s*\n.*System \(M AX L EN\)\s+R-1\s+R-2\s+R-L/.test(page)) throw new Error('Missing Table 4 metrics');
    const names:Record<string,string>={'F ULL':'Full','S TRIDE':'Stride','L IN .':'Linear','LSH':'LSH','S INKHORN':'Sinkhorn'};
    let decoder='Full';
    const rows=[];
    for(const line of page.split('\n')) {
      if(line.includes('Encoder variants w/ H EPOS enc-dec attn.')) decoder='Hepos';
      const row=line.match(/(F ULL|S TRIDE|L IN \.|LSH|S INKHORN) \((\d+)\)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+[\d.]+\s+[\d.]+\s+[\d.]+\s*$/);
      if(!row) continue;
      const [,encoder,length,r1,r2,rL]=row;
      rows.push({model:'BART ('+names[encoder]+' encoder, '+decoder+' cross-attention)',setting:length+' input tokens',
        score:Number(r1), metrics:{rouge2:Number(r2),rougeL:Number(rL)}});
    }
    return checked(rows,7);
  },
} satisfies Leaderboard;
