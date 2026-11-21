// ERRnews evaluates abstractive summarization of Estonian broadcast news stories.
// This importer reads Table 3 of the makers' paper and uses ROUGE-L as the headline metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://www.bjmc.lu.lv/fileadmin/user_upload/lu_portal/projekti/bjmc/Contents/10_3_23_Harm.pdf';
const vals:[string,number,number][]=[['First sentence',10.14,12.03],['LexRank',9.66,10.88],['EstBERT',10.88,11.72],['mBERT',10.14,12.03],['XLM-RoBERTa',10.43,12.07],['mBART',13.43,16.22],['mBART',14.30,17.00],['BART',9.97,13.02],['BART',14.51,17.22]];
const settings=['First sentence','LexRank','EstBERT','mBERT','XLM-RoBERTa','mBART on ERR','mBART on ETNC19, translated CNN/DM and ERR','BART on CNN/DM','BART on CNN/DM and translated ERR'];
const board:Leaderboard={benchmark:'errnews',static:'paper',url:'https://www.bjmc.lu.lv/',feed:FEED,terms:'The paper is publicly available. Cite the paper and follow its terms.',parts:{rouge1:'ROUGE-1'},async fetch(){const b=await pdfText(FEED);if(!b.includes('Table 3. Experimentation results with the models'))throw new Error('Table 3 missing');return checked(vals.map(([model,score,rouge1],i)=>({model,setting:settings[i],score,metrics:{rouge1}})),9)}};
export default board;
