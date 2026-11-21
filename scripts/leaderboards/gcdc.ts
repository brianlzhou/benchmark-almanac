// GCDC evaluates discourse coherence classification across Yahoo, Clinton, Enron, and Yelp documents.
// The source reports no whole-corpus score, so this importer uses the plain mean of the four domain accuracies in Table 5.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/W18-5023.pdf';
const vals:[string,number,number,number,number][]=[['Baseline',43.5,56.0,52.5,55.0],['EGRID',38.0,43.0,46.0,45.5],['EGRID +coref',41.5,48.0,47.0,49.0],['EGRAPH',40.0,56.0,43.5,53.0],['EGRAPH +coref',42.5,55.0,44.0,54.0],['EGRID CONV',47.0,56.3,44.8,54.2],['EGRID CONV +coref',51.0,56.6,44.7,54.0],['LEXGRAPH',37.0,51.0,45.0,48.0],['CLIQUE',53.5,61.0,54.4,49.1],['SENTAVG',52.6,58.4,53.2,54.3],['PARSEQ',54.9,60.2,53.2,54.4]];
const board:Leaderboard={benchmark:'gcdc',static:'paper',url:'https://aclanthology.org/W18-5023/',feed:FEED,terms:'The paper is publicly available from ACL Anthology. Cite the paper and follow ACL terms.',headline:'The paper reports no whole-corpus score, so this is the plain mean of the four domain accuracies.',parts:{yahoo:'Yahoo',clinton:'Clinton',enron:'Enron',yelp:'Yelp'},async fetch(){const b=await pdfText(FEED);if(!b.includes('Table 5: Three-way classification results'))throw new Error('Table 5 missing');return checked(vals.map(([model,yahoo,clinton,enron,yelp])=>({model,score:(yahoo+clinton+enron+yelp)/4,metrics:{yahoo,clinton,enron,yelp}})),11)}};
export default board;
