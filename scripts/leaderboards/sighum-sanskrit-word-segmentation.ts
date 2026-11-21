// SIGHUM Sanskrit Word Segmentation evaluates segmentation of Sanskrit sentences.
// The paper compares three named systems with F-scores on curated and larger corpora.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/W17-2214.pdf';
const board:Leaderboard={benchmark:'sighum-sanskrit-word-segmentation',url:'https://aclanthology.org/W17-2214/',feed,static:'paper',terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',async fetch(){
 const p=await pdfText(feed);if(!p.includes('90.61')||!p.includes('70.07')||!p.includes('66.26'))throw Error('Missing SIGHUM comparison scores');
 return checked([{model:'Krishna et al. (2016a)',score:90.61,setting:'Curated 2,148-sentence corpus'},{model:'Natarajan and Charniak (2011)',score:70.07,setting:'Curated 2,148-sentence corpus'},{model:'Mittal (2010)',score:66.26,setting:'Curated 2,148-sentence corpus'},{model:'Krishna et al. (2016a)',score:77.72,setting:'Digitised corpus of about 10,000 sentences'}],4);
}};export default board;
