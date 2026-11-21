// RegexEval tests language models that generate regular expressions from descriptions.
// The paper's Table 1 reports exact-match correctness on original and refined prompts.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://s2e-lab.github.io/preprints/icse_nier24-preprint.pdf';
const rows=[
  ['Fine-tuned T5','original',0],['Fine-tuned T5','refined',0],
  ['Pre-trained Phi-1.5','original',1.1],['Pre-trained Phi-1.5','refined',1.8],
  ['Text-DaVinci-003','original',16.7],['Text-DaVinci-003','refined',23.4],
  ['GPT-3.5-Turbo','original',33.9],['GPT-3.5-Turbo','refined',33.1],
] as const;
const board:Leaderboard={benchmark:'regexeval',static:'paper',url:'https://s2e-lab.github.io/preprints/icse_nier24-preprint.pdf',feed:FEED,terms:'The authors make the paper available for research use under its publication terms.',async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 1: RegEx generation correctness performance'))throw Error('RegexEval Table 1 missing');return checked(rows.map(([model,setting,score])=>({model,setting,score})),8)}};
export default board;
