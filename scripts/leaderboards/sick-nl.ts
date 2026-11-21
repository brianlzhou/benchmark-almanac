// SICK-NL tests Dutch natural-language inference on sentence pairs.
// The headline score is test-set entailment accuracy from Table 3.
// This importer reads the ACL Anthology paper PDF.
import type {Leaderboard,LeaderboardRow} from './types.ts';import {pdfText} from '../lib/boards/pdf-text.ts';import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2021.eacl-main.126.pdf';const board:Leaderboard={benchmark:'sick-nl',url:'https://aclanthology.org/2021.eacl-main.126/',feed,terms:'ACL Anthology terms. https://aclanthology.org/faq/copyright/',static:'paper',async fetch(){const p=await pdfText(feed),b=p.slice(p.indexOf('SICK                    SICK-NL'),p.indexOf('Table 3: Accuracy results'));const rows:LeaderboardRow[]=[];for(const m of b.matchAll(/(?:BERT|mBERT|RoBERTa)\s+\d+\.\d+\s+(BERTje|mBERT|RobBERT)\s+(\d+\.\d+)/g))rows.push({model:m[1],score:Number(m[2])});return checked(rows,3)}};export default board;
