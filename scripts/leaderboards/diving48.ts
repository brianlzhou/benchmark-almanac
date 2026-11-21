// Diving48 evaluates action recognition across 48 diving classes.
// Table 3 reports recognition accuracy for seven RGB, flow and two-stream baselines.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://openaccess.thecvf.com/content_ECCV_2018/papers/Yingwei_Li_RESOUND_Towards_Action_ECCV_2018_paper.pdf';
const board:Leaderboard={benchmark:'diving48',url:'https://openaccess.thecvf.com/content_ECCV_2018/html/Li_RESOUND_Towards_Action_ECCV_2018_paper.html',feed,static:'paper',terms:'The CVF paper is available under the open-access terms at https://openaccess.thecvf.com/.',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 3. Recognition accuracy on Diving48')) throw new Error('Missing Diving48 Table 3');
 const vals=[['TSN(RGB)',16.77],['TSN(Flow)',19.64],['TSN(RGB+Flow)',20.28],['C3D(L=8)',11.51],['C3D(L=16)',16.43],['C3D(L=32)',21.01],['C3D(L=64)',27.60]] as const;
 return checked(vals.map(([model,score])=>({model,score})),7);
}}; export default board;
