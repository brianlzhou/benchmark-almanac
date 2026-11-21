// The organizers rank Task 1 teams by positive-class F1 across all four languages. Table 1 of their workshop paper gives official final scores.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://workshop-proceedings.icwsm.org/pdf/2025_55.pdf";


const board: Leaderboard = {
  benchmark: "smm4h-multilingual-ade-2025", static: 'paper',
  url: "https://codalab.lisn.upsaclay.fr/competitions/21886",
  feed,
  terms: "The competition terms permit public release of participant scores. CodaLab serves HTML at robots.txt and the workshop proceedings return 404.",
  stats: { precision: { name: 'Precision', unit: 'score', better: 'higher', note: 'Precision stored from 0 to 1.' }, recall: { name: 'Recall', unit: 'score', better: 'higher', note: 'Recall stored from 0 to 1.' } },
  async fetch(){
    const pdf=await pdfText(feed);
    const table=pdf.split(/Team\s+F1\s+P\s+R\s+System Summary/)[1]?.split('Table 1:')[0];
    if(!table) throw new Error('Missing Task 1 standings');
    const rows=[...table.matchAll(/^\s*([^\n]+?)\s+(0\.\d+)\s+(0\.\d+)\s+(0\.\d+)\s+[^\n]+/gm)].map(m=>({
      model:m[1].trim(),submitter:m[1].trim(),score:Number(m[2]),metrics:{precision:Number(m[3]),recall:Number(m[4])}
    }));
    if(rows.length<11) throw new Error('Missing Task 1 teams or baseline');
    return rows;
  },
};
export default board;
