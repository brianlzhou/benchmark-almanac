// PubMed causal language use tests sentence-relation classification in biomedical abstracts.
// The headline score is macro-F1 from the paper's four-model comparison, converted to percent.
// This importer reads Table 4 from the ACL Anthology PDF.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/D19-1473.pdf';
const board:Leaderboard={benchmark:'pubmed-causal-language',url:'https://aclanthology.org/D19-1473/',feed,terms:'ACL Anthology terms. https://aclanthology.org/faq/copyright/',static:'paper',stats:{precision:{name:'Precision',unit:'%',better:'higher'},recall:{name:'Recall',unit:'%',better:'higher'},accuracy:{name:'Accuracy',unit:'%',better:'higher'}},async fetch(){
 const p=await pdfText(feed); const block=p.slice(p.indexOf('Precision Recall Accuracy F1'),p.indexOf('Table 4: Model performance'));
 if(!block.includes('BioBERT')) throw new Error('Table 4 missing');
 const rows:LeaderboardRow[]=[];
 for(const m of block.matchAll(/(LinearSVM|BiRNN|BERT|BioBERT)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/g)) rows.push({model:m[1],score:Number(m[5])*100,metrics:{precision:Number(m[2])*100,recall:Number(m[3])*100,accuracy:Number(m[4])*100}});
 return checked(rows,4);
}};
export default board;
