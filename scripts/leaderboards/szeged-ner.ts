// Szeged NER evaluates Hungarian named entity recognition.
// Table 2 reports phrase-level F-measure for three classifiers and two ensembles.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/L06-1215.pdf';
const board:Leaderboard={benchmark:'szeged-ner',url:'https://aclanthology.org/L06-1215/',feed,static:'paper',terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',async fetch(){const p=await pdfText(feed);if(!p.includes('BOOSTING')||!p.includes('92.77%'))throw Error('Missing Szeged Table 2');return checked([{model:'ANN',score:85,metrics:{termAccuracy:92.19,phrasePostProcessed:87.39}},{model:'SVM',score:84.22,metrics:{termAccuracy:91.44,phrasePostProcessed:86.17}},{model:'C4.5',score:84.04,metrics:{termAccuracy:91.8,phrasePostProcessed:87.83}},{model:'VOTING',score:87.53,metrics:{termAccuracy:92.91,phrasePostProcessed:89.16}},{model:'BOOSTING + C4.5',score:92.77,metrics:{termAccuracy:94.19,phrasePostProcessed:92.81}}],5);}};export default board;
