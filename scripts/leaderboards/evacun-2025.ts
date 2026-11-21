// EvaCun 2025 evaluates Akkadian lemmatization and token prediction on cuneiform transliterations.
// This importer reads the three named lemmatization submissions in Table 4 and keeps the subset accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2025.alp-1.33.pdf';
const rows:LeaderboardRow[]=[
 {model:'ByT5',score:0.84,metrics:{func:0.98,nonFunc:0.80,inVocab:0.89,oov:0.48}},
 {model:'LLM ambiguity resolver',score:0.94,metrics:{func:0.98,nonFunc:0.93,inVocab:0.97,oov:0.72}},
 {model:'Low-shot prompting',score:0.31,metrics:{func:0.83,nonFunc:0.15,inVocab:0.34,oov:0.07}},
];
const board:Leaderboard={benchmark:'evacun-2025',static:'paper',url:'https://digitalpasts.github.io/EvaCUN/',feed:FEED,terms:'The paper is publicly available from ACL Anthology. Cite the paper and follow ACL terms.',parts:{func:'Function words',nonFunc:'Non-function words',inVocab:'In-vocabulary words',oov:'Out-of-vocabulary words'},async fetch(){const b=await pdfText(FEED);if(!b.includes('Table 4: Accuracy results for lemmatization'))throw new Error('Table 4 missing');return checked(rows,3)}};
export default board;
