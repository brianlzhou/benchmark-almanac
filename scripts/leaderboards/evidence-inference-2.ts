// Evidence Inference 2.0 tests extraction of evidence and direction from clinical trial abstracts.
// Table 7 reports end-to-end F scores for named pipelines and baselines.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2020.bionlp-1.13.pdf';
const board:Leaderboard={benchmark:'evidence-inference-2',static:'paper',url:'https://aclanthology.org/2020.bionlp-1.13/',feed,terms:'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',async fetch(){const t=await pdfText(feed);if(!/BR Pipeline\s+X\s+\.784\s+\.777\s+\.780/.test(t)||!/SB Pipeline\s+X\s+\.750\s+\.750\s+\.749/.test(t))throw new Error('Missing Evidence Inference Table 7');return checked([{model:'BR Pipeline',score:78.0,metrics:{precision:78.4,recall:77.7}},{model:'SB Pipeline',score:74.9,metrics:{precision:75.0,recall:75.0}},{model:'BR Pipeline',setting:'abstracts only',score:77.6,metrics:{precision:77.6,recall:77.7}},{model:'SB Pipeline',setting:'abstracts only',score:79.9,metrics:{precision:80.3,recall:79.8}},{model:'Baseline',score:51.4,metrics:{precision:52.6,recall:51.6}},{model:'BR Oracle Spans',score:85.1,metrics:{precision:85.1,recall:85.3}},{model:'SB Oracle Spans',score:83.8,metrics:{precision:84.0,recall:84.0}}],7);}};export default board;
