// EstNER tests Estonian named entity recognition across eleven entity types.
// This importer reads Table 5 in the benchmark paper and uses the combined-test overall F1 score.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2023.nodalida-1.76.pdf';
const board:Leaderboard={benchmark:'estner',url:'https://aclanthology.org/2023.nodalida-1.76/',feed,static:'paper',terms:'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',parts:{PER:'PER',ORG:'ORG',LOC:'LOC',GPE:'GPE',TITLE:'TITLE',PROD:'PROD',EVENT:'EVENT',DATE:'DATE',TIME:'TIME',PERCENT:'PERCENT',MONEY:'MONEY'},async fetch(){
 const p=await pdfText(feed); const m=p.match(/Overall\s+\.761 \([^)]*\)\s+\.766 \([^)]*\)\s+\.752 \([^)]*\)\s+\.773 \([^)]*\)\s+\.766\s+\.783\s+\.774/); if(!m) throw new Error('Missing EstNER Table 5');
 return checked([{model:'EstBERT',score:77.4,metrics:{PER:88.2,ORG:69.6,LOC:51.7,GPE:82.8,TITLE:77.3,PROD:57.8,EVENT:27.8,DATE:74.7,TIME:50.7,PERCENT:97.5,MONEY:69.0}}],1);
}}; export default board;
