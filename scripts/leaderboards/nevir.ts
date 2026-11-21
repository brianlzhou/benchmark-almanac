// NevIR tests whether retrieval systems distinguish passages that differ in negation. Table 2
// gives paired accuracy: both queries must rank their relevant passage first. RocketQA has
// separate bi-encoder and cross-encoder configurations. Parameter counts are in billions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed='https://aclanthology.org/2024.eacl-long.139.pdf';
const board:Leaderboard = {
  benchmark:'nevir',static:'paper',url:'https://aclanthology.org/2024.eacl-long.139/',feed,
  terms:'ACL Anthology copyright and licensing terms. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const pdf=await pdfText(feed);
    const table=pdf.match(/Type\s+Data\s+Params\s+Model Name\s+Score([\s\S]*?)Table 2: Results for pairwise contrastive evaluation/);
    if (!table || !table[1].includes('Cross-Encoders')) throw new Error('Missing NevIR Table 2');
    let architecture='Sparse';
    const rows:LeaderboardRow[]=[];
    for (const line of table[1].split('\n')) {
      if (!line.trim().endsWith('%') || line.includes('Random')) continue;
      const m=line.match(/(?:N\/A|MSMarco|NQ|QA Data|STSB|MNLI|QNLI)\s+(N\/A|\d+(?:\.\d+)?[MB])\s+(.+?)\s+(\d+(?:\.\d+)?)%\s*$/);
      if (!m) throw new Error('Invalid retrieval result: '+line);
      const model=m[2].replace(/\s+\([^()]*\d{4}[a-z]?\)$/,'');
      if (model === 'ColBERTv2') architecture='Late interaction';
      if (model === 'DPR') architecture='Bi-encoder';
      if (model === 'RocketQA v2' && rows.some(r=>r.model === model)) architecture='Cross-encoder';
      const params=m[1] === 'N/A' ? undefined : parseFloat(m[1])/(m[1].endsWith('M') ? 1000 : 1);
      rows.push({model,setting:architecture,score:Number(m[3]),params});
    }
    return checked(rows,23);
  },
};
export default board;
