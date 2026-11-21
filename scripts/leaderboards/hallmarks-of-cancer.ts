// Hallmarks of Cancer tests hierarchical multi-label classification of PubMed abstracts.
// The headline is the paper's average test F-score across ten hallmark labels.
// This importer reads Table 4 of Baker et al.'s CNN paper.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://www.repository.cam.ac.uk/bitstream/handle/1810/270037/BIOTXTM2016.pdf?sequence=1&isAllowed=y';
const board:Leaderboard={benchmark:'hallmarks-of-cancer',url:'https://www.repository.cam.ac.uk/handle/1810/270037',feed:FEED,static:'paper',terms:'The repository provides the paper for scholarly use. https://www.repository.cam.ac.uk/handle/1810/270037',async fetch(){
 const t=await pdfText(FEED); const s=t.split('Table 5: Comparison of test results using AUC')[0].split('4.2    Test results').at(-1); if(!s||!s.includes('Average'))throw new Error('Hallmarks Table 4 missing');
 const ms=[...s.matchAll(/Average\s+(\d+\.\d+)%?\s+(\d+\.\d+)%?\s+(\d+\.\d+)%?\s+(\d+\.\d+)%?/g)]; const m=ms.at(-1); if(!m)throw new Error('Hallmarks average row missing');
 const rows:LeaderboardRow[]=[{model:'SVM BoW',score:Number(m[1])/100},{model:'SVM Rich',score:Number(m[2])/100},{model:'CNN Base',score:Number(m[3])/100},{model:'CNN Tuned',score:Number(m[4])/100}]; return checked(rows,4);
}}; export default board;
