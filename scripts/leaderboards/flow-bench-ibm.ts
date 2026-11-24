// FLOW-BENCH measures exact matches between generated workflows and reference workflows.
// Table 4 evaluates the same tasks using in-domain or cross-domain demonstrations.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.emnlp-industry.100.pdf';
const board: Leaderboard = {
  benchmark:'flow-bench-ibm',static:'paper',url:'https://aclanthology.org/2025.emnlp-industry.100/',feed,
  terms:'ACL Anthology publishes the paper and license at https://aclanthology.org/2025.emnlp-industry.100/.',
  stats:{syntaxF1:{name:'Syntax F1',unit:'score',better:'higher'}},
  aliases:{'Codellama-34b-instruct-hf':'codellama-34b-instruct'},
  async fetch() {
    const text = await pdfText(feed);
    const table = text.match(/Model\s+Activities Domain\s+Exact Match\s+Syntax F1\s*\n([\s\S]+?)Table 4: Evaluation of different models/);
    if (!table) throw new Error('Missing FLOW-BENCH Table 4');
    // The PDF centers model names vertically across each pair. They sometimes fall between the two result lines.
    const labels = [...table[1].matchAll(/^ ([\w-]+)\s*$/gm)].map(m=>m[1]);
    const values = [...table[1].matchAll(/^\s*(in-domain|cross-domain)\s+([\d.]+)\s+([\d.]+)/gm)];
    if (values.length!==2*labels.length) throw new Error('Incomplete model pair');
    return checked(values.map(([_,setting,score,f1],i)=>{
      if (setting!==(i%2?'cross-domain':'in-domain')) throw new Error('Unexpected demonstration setting');
      return {model:labels[Math.floor(i/2)],setting:setting+' demonstrations',harness:'Flow-Gen',
        score:Number(score),metrics:{syntaxF1:Number(f1)}};
    }),16);
  },
};
export default board;
