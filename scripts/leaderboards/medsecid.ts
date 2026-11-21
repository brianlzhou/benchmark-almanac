// MedSecId evaluates medical note section identification.
// The paper's Table 5 reports micro and macro F1, so the headline uses micro F1.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2022.coling-1.326.pdf';
const rows=[['BERTsent',.925,.589],['BiLSTM-CRFtok (word2vec)',.927,.778],['BERT-CRFsent',.929,.689],['BERTsent BioBERT',.94,.687],['BERT-CRFsent BioBERT',.94,.705],['BiLSTM-CRFtok (GloVE 50D)',.954,.76],['BiLSTM-CRFtok fastText',.954,.796],['BiLSTM-CRFtok (GloVE 300D)',.955,.787]] as const;
const board:Leaderboard={benchmark:'medsecid',static:'paper',url:'https://aclanthology.org/2022.coling-1.326/',feed:FEED,terms:'The paper is available from ACL Anthology under its publication terms. https://aclanthology.org/faq/copyright/',parts:{macroF1:{name:'Macro F1'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 5: Summarization of performance metrics'))throw Error('MedSecId Table 5 missing');return checked(rows.map(r=>({model:r[0],score:r[1],metrics:{macroF1:r[2]}})),8)}};
export default board;
