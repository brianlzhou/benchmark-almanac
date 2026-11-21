// UD Latin CIRCSE evaluates Latin morphosyntactic tagging and dependency parsing.
// Table 6 reports the CIRCSE test set's UPOS, UFeats, lemma, UAS and LAS scores for named parsers.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2024.nlp4dh-1.21.pdf';
const rows: [string, number, number, number | null, number | null, number | null][]=[
 ['Stanza PROIEL',84.46,59.48,72.37,48.18,41.38],['Trankit PROIEL',81.50,55.39,60.08,49.44,41.92],
 ['Custom Perseus',76.29,47.79,null,null,null],['Custom PROIEL',79.72,55.29,null,null,null],['Custom Five Merged',81.30,57.11,null,null,null],['Custom Classical',80.84,56.53,null,null,null],['LASLA',91.17,70.52,null,null,null],
 ['Stanza Classical',84.37,56.79,73.36,49.64,43.03],['Stanza Five Merged',82.56,51.23,78.00,47.00,40.14],['Trankit Classical',83.08,57.09,62.87,50.57,43.06],['Trankit Five Merged',83.21,57.76,68.15,51.29,44.54],
] as const;
const board:Leaderboard={benchmark:'ud-latin-circse',static:'paper',url:'https://aclanthology.org/2024.nlp4dh-1.21/',feed:FEED,terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',headline:'The paper reports several measures, so this is the UPOS tagging score, the first scored task column.',stats:{ufeats:{name:'Universal morphological features',unit:'%',better:'higher'},lemmas:{name:'Lemma accuracy',unit:'%',better:'higher'},uas:{name:'Unlabeled attachment score',unit:'%',better:'higher'},las:{name:'Labeled attachment score',unit:'%',better:'higher'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 6: The results of the CIRCSE test set'))throw Error('UD Latin CIRCSE Table 6 missing');return checked(rows.map(([model,score,ufeats,lemmas,uas,las])=>({model,score,metrics:{ufeats,...(lemmas===null?{}:{lemmas}),...(uas===null?{}:{uas}),...(las===null?{}:{las})}})),11)}};
export default board;
