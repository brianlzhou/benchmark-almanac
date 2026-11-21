// NorSumm evaluates Norwegian news summaries against three human references. Table 4 reports
// ROUGE-L and BERTScore for Bokmål, Nynorsk and the combined development and test data.
// The authors select prompts by BERTScore. The headline uses the first overall column, ROUGE-L.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed='https://aclanthology.org/2025.nodalida-1.73.pdf';
const board:Leaderboard = {
  benchmark:'norsumm',static:'paper',url:'https://aclanthology.org/2025.nodalida-1.73/',feed,
  terms:'ACL Anthology copyright and licensing terms. https://aclanthology.org/faq/copyright/',
  headline:'The headline is overall ROUGE-L, the first metric in Table 4, across Bokmål and Nynorsk.',
  parts:{bmRouge:{name:'ROUGE-L',group:'Bokmål',unit:'score'},bmBert:{name:'BERTScore',group:'Bokmål',unit:'score'},
    nnRouge:{name:'ROUGE-L',group:'Nynorsk',unit:'score'},nnBert:{name:'BERTScore',group:'Nynorsk',unit:'score'},bert:{name:'Overall BERTScore',unit:'score'}},
  async fetch() {
    const paper=await pdfText(feed);
    const m=paper.match(/BM\s+NN\s+Overall\s+Model\s+(?:ROUGE-L\s+BERTScore\s+){3}([\s\S]*?)Table 4: Zero-shot evaluation/);
    if (!m) throw new Error('Missing NorSumm Table 4');
    return checked(m[1].trim().split(/\n/).filter(s=>s.trim()).map(line=>{
      const [model,...cells]=line.trim().split(/\s+/);
      const values=cells.map(Number);
      if (values.length !== 6 || !values.every(Number.isFinite)) throw new Error('Invalid NorSumm score for '+model);
      const [bmRouge,bmBert,nnRouge,nnBert,score,bert]=values;
      return {model,setting:'Zero-shot',score,metrics:{bmRouge,bmBert,nnRouge,nnBert,bert}};
    }),9);
  },
};
export default board;
