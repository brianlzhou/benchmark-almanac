// SkillSpan evaluates skill and knowledge span extraction in job postings.
// The paper's Table 5 reports span F1 for skills, knowledge and combined multi-task evaluation.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2022.naacl-main.366.pdf';
const rows=[
 {model:'BERTbase',setting:'average',score:57.73,metrics:{skillsSTL:54.34,skillsMTL:54.20,knowledgeSTL:62.43,knowledgeMTL:61.66,combinedSTL:58.16}},
 {model:'SpanBERT',setting:'average',score:58.88,metrics:{skillsSTL:58.53,skillsMTL:58.60,knowledgeSTL:58.89,knowledgeMTL:59.21,combinedSTL:58.69}},
 {model:'JobBERT',setting:'average',score:59.44,metrics:{skillsSTL:60.05,skillsMTL:59.69,knowledgeSTL:60.66,knowledgeMTL:59.15,combinedSTL:60.32}},
 {model:'JobSpanBERT',setting:'average',score:59.29,metrics:{skillsSTL:60.07,skillsMTL:59.51,knowledgeSTL:59.47,knowledgeMTL:59.04,combinedSTL:59.79}},
 {model:'JobBERT',setting:'test',score:59.18,metrics:{skillsSTL:56.11,skillsMTL:55.46,knowledgeSTL:63.88,knowledgeMTL:63.35,combinedSTL:59.73}},
 {model:'JobSpanBERT',setting:'test',score:58.90,metrics:{skillsSTL:56.64,skillsMTL:56.27,knowledgeSTL:61.06,knowledgeMTL:61.87,combinedSTL:58.72}},
];
const board:Leaderboard={benchmark:'skillspan',static:'paper',url:'https://aclanthology.org/2022.naacl-main.366/',feed:FEED,terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',parts:{skillsSTL:{name:'Skills, single-task'},skillsMTL:{name:'Skills, multi-task'},knowledgeSTL:{name:'Knowledge, single-task'},knowledgeMTL:{name:'Knowledge, multi-task'},combinedSTL:{name:'Combined, single-task'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 5: Performance of Models'))throw Error('SkillSpan Table 5 missing');return checked(rows,6)}};
export default board;
