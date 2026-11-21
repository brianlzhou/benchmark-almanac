// EtiCor tests etiquette sensitivity across five world regions.
// Table 8 reports overall accuracy with abstentions treated as negatives for three language models.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2023.emnlp-main.428.pdf';
const board:Leaderboard={benchmark:'eticor',url:'https://aclanthology.org/2023.emnlp-main.428/',feed,static:'paper',parts:{eastAfrica:'EA',india:'IN',middleEastAfrica:'MEA',northEast:'NE',latinAmerica:'LA'},terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 8: Results of models after including abstained predictions as negatives')) throw new Error('Missing EtiCor Table 8');
 const vals=[['Delphi',61,56,69,57,75,55],['Falcon-40B',63,62.1,60.3,68.1,69.7,54.1],['GPT-3.5',55,54,52,55,62,53]] as const;
 return checked(vals.map(([model,score,ea,ind,mea,ne,la])=>({model,score,metrics:{eastAfrica:ea,india:ind,middleEastAfrica:mea,northEast:ne,latinAmerica:la}})),3);
}}; export default board;
