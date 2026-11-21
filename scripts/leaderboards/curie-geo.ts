// CURIE GEO tests geospatial dataset extraction over scientific papers.
// The source reports two GEO metrics and no single combined score, so this importer uses the first GEO column, ROUGE-L.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://proceedings.iclr.cc/paper_files/paper/2025/file/1ae4999aefb509d75d8608e07280922c-Paper-Conference.pdf';
const vals: [string,number,number][]=[['Mixtral',20.23,0.67],['Command-R+',21.36,0.78],['LongLLaMa',9.53,0.77],['Gemini 1.0 Pro',22.56,0.79],['GPT-4o',27.30,0.80],['Gemini 1.5 Pro',27.24,0.74],['Gemini 1.5 Flash',27.76,0.78],['Gemini 2.0 Flash',29.69,0.79],['Claude 3 (Opus)',28.66,0.79]];
const board:Leaderboard={benchmark:'curie-geo',static:'paper',url:'https://github.com/google/curie',feed:FEED,terms:'The paper is publicly available from ICLR. Cite the paper and follow the conference terms.',headline:'The GEO task reports no combined score, so this headline uses its ROUGE-L column.',parts:{geoBertScore:'GEO BERTScore-F1'},async fetch(){const b=await pdfText(FEED);if(!b.includes('Table 1: Results comparing performance of all models'))throw new Error('Table 1 missing');return checked(vals.map(([model,score,bert])=>({model,score,metrics:{geoBertScore:bert}})),9)}};
export default board;
