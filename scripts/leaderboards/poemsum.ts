// PoemSum tests abstractive summarization of poems against human summaries.
// The headline score is the paper's first metric, ROUGE-1, in percent.
// This importer reads the original paper's four-model results table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2023.emnlp-main.920.pdf';
const board:Leaderboard={benchmark:'poemsum',url:'https://aclanthology.org/2023.emnlp-main.920/',feed,terms:'ACL Anthology terms. https://aclanthology.org/faq/copyright/',static:'paper',async fetch(){
 const p=await pdfText(feed); const block=p.slice(Math.max(0,p.search(/Model\s+R1\s+R2\s+RL\s+BS/)-100),p.indexOf('Table 2: Performance of different Models'));
 if(!block.includes('T5') || !block.includes('mT5')) throw new Error('PoemSum table missing');
 const rows:LeaderboardRow[]=[];
 for(const m of block.matchAll(/(T5|Pegasus|Bart|mT5)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/g)) rows.push({model:m[1],score:Number(m[2]),metrics:{rouge2:Number(m[3]),rougeL:Number(m[4]),bertScore:Number(m[5])}});
 return checked(rows,4);
}};
export default board;
