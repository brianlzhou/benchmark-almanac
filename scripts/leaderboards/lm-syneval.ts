// LM-SynEval tests targeted syntactic knowledge with agreement, anaphora and polarity items.
// The paper has no overall column, so this importer uses the plain mean of its 15 test conditions.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/D18-1151.pdf';
const names=['subjectSimple','subjectComplement','shortVpCoordination','longVpCoordination','prepPhrase','subjectRelative','objectRelative','objectRelativeNoThat','inObjectRelative','inObjectRelativeNoThat','reflexiveSimple','reflexiveComplement','reflexiveRelative','npiSimple','npiRelative'];
const vals=[['RNN',[.94,.99,.90,.61,.57,.56,.50,.52,.84,.71,.83,.86,.55,.40,.41]],['Multitask RNN',[1,.93,.90,.81,.69,.74,.57,.52,.89,.81,.86,.83,.56,.48,.73]],['5-gram',[.79,.79,.51,.50,.50,.50,.50,.50,.50,.50,.50,.50,.50,.06,.60]]] as const;
const parts=Object.fromEntries(names.map((n,i)=>[n,{name:n}]));
const board:Leaderboard={benchmark:'lm-syneval',static:'paper',url:'https://aclanthology.org/D18-1151/',feed:FEED,terms:'The paper is available from ACL Anthology under its publication terms. https://aclanthology.org/faq/copyright/',headline:'The paper reports no overall score, so this is the plain mean of its 15 syntactic test conditions.',parts,async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 1: Overall accuracies'))throw Error('LM-SynEval Table 1 missing');return checked(vals.map(([model,v])=>({model,score:v.reduce((a,b)=>a+b,0)/v.length*100,metrics:Object.fromEntries(names.map((n,i)=>[n,v[i]*100]))})),3)}};
export default board;
