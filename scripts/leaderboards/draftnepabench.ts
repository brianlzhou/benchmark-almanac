// DraftNEPABench measures the quality of generated NEPA document sections on a 1 to 5 rubric.
// This importer reads the Aggregated judge rows in Table 2, retaining criterion scores and score uncertainty.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://www.pnnl.gov/sites/default/files/media/file/PREPRINT_PNNL_PolicyAI_DraftNEPABench_OpenAI.pdf';
const vals:[string,number,number,number,number,number,number][]=[['GPT-5',2.41,0.76,1.90,4.11,3.04,1.63],['Gemini 2.5 Pro',2.21,0.64,1.68,4.10,2.61,1.63],['Claude Sonnet 4.5',2.22,0.71,1.72,4.02,2.71,1.46],['Codex CLI',3.27,0.68,2.92,4.20,3.23,3.52],['Gemini CLI',2.90,0.64,2.62,3.90,2.37,3.38],['Claude Code',3.75,0.74,3.47,4.54,3.64,3.88]];
const board:Leaderboard={benchmark:'draftnepabench',static:'paper',url:'https://github.com/pnnl/PermitAI/tree/master/DraftNEPABench',feed:FEED,terms:'The preprint is publicly available from PNNL. Cite the paper and follow its terms.',parts:{accuracy:'Accuracy',clarity:'Clarity',reference:'Reference',structure:'Structure'},async fetch(){const b=await pdfText(FEED);if(!b.includes('Table 2: Overall performance'))throw new Error('Table 2 missing');return checked(vals.map(([model,score,stderr,accuracy,clarity,reference,structure])=>({model,score,metrics:{stderr,accuracy,clarity,reference,structure}})),6)}};
export default board;
