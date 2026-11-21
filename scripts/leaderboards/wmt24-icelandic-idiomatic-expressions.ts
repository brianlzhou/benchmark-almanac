// WMT24 Icelandic Idiomatic Expressions evaluates English to Icelandic translation of idioms.
// Table 4 reports automatic total accuracy for 17 named systems.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2024.wmt-1.31.pdf';
const board:Leaderboard={benchmark:'wmt24-icelandic-idiomatic-expressions',url:'https://aclanthology.org/2024.wmt-1.31/',feed,static:'paper',terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',async fetch(){const p=await pdfText(feed);const t=p.split(/System name\s+Total score/)[1]?.split('Table 4:')[0];if(!t)throw Error('Missing WMT24 idioms Table 4');const rows=[...t.matchAll(/^\s*([^\n]+?)\s+(0\.\d+)\s+\d+\s+0\.\d+\s+\d+\s+0\.\d+\s*$/gm)].map(m=>({model:m[1].trim(),score:Number(m[2])*100}));if(rows.length<17)throw Error('Incomplete WMT24 idioms rows');return checked(rows,17);}};export default board;
