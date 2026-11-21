// MAPA EUR-Lex tests named-entity recognition in anonymized legal text.
// The headline is the paper's average F1 across all fine-tuning and evaluation settings.
// This importer reads the model-average column of Table 4.
import type {Leaderboard,LeaderboardRow} from './types.ts'; import {pdfText} from '../lib/boards/pdf-text.ts'; import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2022.lrec-1.400.pdf'; const board:Leaderboard={benchmark:'mapa-eur-lex',url:'https://aclanthology.org/2022.lrec-1.400/',feed:FEED,static:'paper',terms:'ACL Anthology terms. https://aclanthology.org/faq/copyright/',async fetch(){const t=await pdfText(FEED);if(!t.includes('Table 4: F1 Results for NERC'))throw new Error('MAPA Table 4 missing');return checked([{model:'mBERT',score:0.907},{model:'BETO',score:0.910},{model:'RoBERTa-b',score:0.886},{model:'RoBERTaLex',score:0.869}],4);}};export default board;
