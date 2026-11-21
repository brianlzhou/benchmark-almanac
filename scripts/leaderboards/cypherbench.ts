// CypherBench tests text-to-Cypher generation over eleven property graphs.
// Table 2 reports execution accuracy, provenance subgraph Jaccard similarity and executable percentage.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2025.acl-long.438.pdf';
const board:Leaderboard={benchmark:'cypherbench',url:'https://aclanthology.org/2025.acl-long.438/',feed,static:'paper',parts:{psjs:'PSJS',exec:'Executable percentage'},terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 2: Zero-shot execution accuracy')) throw new Error('Missing CypherBench Table 2');
 const vals=[['llama3.2-3b',11.20,17.33,86.46],['llama3.1-8b',18.82,30.98,90.67],['gemma2-9b',18.61,30.67,68.57],['mixtral-8x7b',19.21,37.01,59.33],['qwen2.5-72b',41.87,56.39,86.84],['llama3.1-70b',38.84,54.79,92.25],['yi-large',33.82,47.21,83.52],['gemini1.5-flash-001',25.26,41.46,83.65],['gemini1.5-pro-001',39.95,57.70,86.03],['gpt-4o-mini-20240718',31.43,45.91,87.39],['gpt-4o-20240806',60.18,76.87,94.93],['claude3.5-sonnet-20240620',61.58,80.85,96.34]] as const;
 return checked(vals.map(([model,score,psjs,exec])=>({model,score,metrics:{psjs,exec}})),12);
}}; export default board;
