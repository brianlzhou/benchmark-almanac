// JAMP tests Japanese temporal natural language inference.
// The paper reports accuracy for seen and unseen examples across several splits.
// This importer uses the fine-tuning IID split as the headline and preserves the other split scores.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2023.acl-srw.8.pdf';
const values: Array<[string,string,number,number,number,number,number]> = [
 ['BERT base','seen',89.1,87.9,81.2,83.9,80.0], ['BERT base','unseen',42.8,40.5,37.9,89.7,76.1],
 ['BERT large','seen',95.5,96.9,96.8,92.0,92.2], ['BERT large','unseen',44.0,45.7,41.9,97.0,89.3],
 ['RoBERTa base','seen',91.4,89.8,85.1,83.2,75.4], ['RoBERTa base','unseen',46.8,38.8,31.8,84.6,67.7],
 ['RoBERTa large','seen',93.7,97.0,98.4,91.4,90.7], ['RoBERTa large','unseen',46.0,44.5,39.9,96.7,88.4],
 ['XLM-RoBERTa base','seen',76.8,68.3,64.9,69.0,60.7], ['XLM-RoBERTa base','unseen',41.1,23.8,30.9,67.8,54.1],
 ['XLM-RoBERTa large','seen',94.1,95.2,95.5,88.3,86.2], ['XLM-RoBERTa large','unseen',48.8,45.5,38.3,93.5,78.3],
];
const board:Leaderboard={benchmark:'jamp',static:'paper',url:'https://aclanthology.org/2023.acl-srw.8/',feed:FEED,terms:'The paper is available from ACL Anthology under its publication terms. https://aclanthology.org/faq/copyright/',headline:'The paper reports no overall score, so this is the plain mean of five accuracy columns.',parts:{iid:{name:'IID split'},tenseEasy:{name:'Tense fragment easy'},tenseHard:{name:'Tense fragment hard'},timeFormatEasy:{name:'Time format easy'},timeFormatHard:{name:'Time format hard'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 8: Results on our test data'))throw Error('JAMP Table 8 missing');return checked(values.map(v=>({model:v[0],setting:`fine-tuning, ${v[1]}`,score:(v[2]+v[3]+v[4]+v[5]+v[6])/5,metrics:{iid:v[2],tenseEasy:v[3],tenseHard:v[4],timeFormatEasy:v[5],timeFormatHard:v[6]}})),12)}};
export default board;
