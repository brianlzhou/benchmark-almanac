// FoNE tests Faroese named entity recognition. Table 3 reports NER F1 for named Scandinavian language models.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2023.nodalida-1.74.pdf';
const board:Leaderboard={benchmark:'fone',static:'paper',url:'https://aclanthology.org/2023.nodalida-1.74/',feed,terms:'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',async fetch(){const t=await pdfText(feed);if(!/IceBERT\s+74\.4.*?67\.7/.test(t)||!/XLM-R\s+68\.9.*?59\.7/.test(t))throw new Error('Missing FoNE Table 3');return checked([{model:'IceBERT',score:67.7},{model:'IceBERT-fc3',score:88.5},{model:'XLM-R',score:59.7},{model:'XLM-R-fc3',score:88.8},{model:'ScandiBERT-no-fo',score:65.1},{model:'ScandiBERT-n.f.-fc3',score:89.2},{model:'ScandiBERT',score:65.7},{model:'ScandiBERT-fc3',score:88.8}],8);}};export default board;
