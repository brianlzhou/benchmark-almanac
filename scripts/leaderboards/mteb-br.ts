// Canonical 22-task mean in original 0–1 units. Dataset is CC BY 4.0.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://datasets-server.huggingface.co/rows?dataset=MTEB-BR%2Fmteb-pt-results&config=score_matrix&split=train&offset=0&length=100';
const board:Leaderboard={benchmark:'mteb-br', parts: {
  HateBR: { name: 'HateBR', group: 'Split' },
  FactckBrClassification: { name: 'FactckBrClassification', group: 'Split' },
  ToxSynPT: { name: 'ToxSynPT', group: 'Split' },
  PortuLexRRIP: { name: 'PortuLexRRIP', group: 'Split' },
  BrighterEmotionMultilabelClassification: { name: 'BrighterEmotionMultilabelClassification', group: 'Split' },
  AssinRTE: { name: 'AssinRTE', group: 'Split' },
  InferBR: { name: 'InferBR', group: 'Split' },
  AssinSTS: { name: 'AssinSTS', group: 'Split' },
  Assin2STS: { name: 'Assin2STS', group: 'Split' },
  MedPTClustering: { name: 'MedPTClustering', group: 'Split' },
  WikipediaPTCategoriesClusteringP2P: { name: 'WikipediaPTCategoriesClusteringP2P', group: 'Split' },
  JurisTCUClusteringP2P: { name: 'JurisTCUClusteringP2P', group: 'Split' },
  SciELOClusteringP2P: { name: 'SciELOClusteringP2P', group: 'Split' },
  StackoverflowPtClustering: { name: 'StackoverflowPtClustering', group: 'Split' },
  MedPTRetrieval: { name: 'MedPTRetrieval', group: 'Split' },
  FaQuADIR: { name: 'FaQuADIR', group: 'Split' },
  Quati: { name: 'Quati', group: 'Split' },
  FaqBacenRetrieval: { name: 'FaqBacenRetrieval', group: 'Split' },
  JurisTCU: { name: 'JurisTCU', group: 'Split' },
  BRTaxQAR: { name: 'BRTaxQAR', group: 'Split' },
  QuatiReranking: { name: 'QuatiReranking', group: 'Split' },
  JurisTCUReranking: { name: 'JurisTCUReranking', group: 'Split' },
},url:'https://huggingface.co/datasets/MTEB-BR/mteb-pt-results',feed:FEED,
 terms:'CC BY 4.0 maker results; public Dataset Viewer API has no robots.txt restriction.',
 async fetch(){const d=await fetchJson<{rows:{row:Record<string,unknown>;truncated_cells:string[]}[];num_rows_total:number}>(FEED);
 if(d.num_rows_total>d.rows.length||d.rows.some(r=>r.truncated_cells.length))throw new Error('Incomplete results');
 const rows=d.rows.filter(({row:r})=>!String(r.model).includes('random')).map(({row:r})=>({model:String(r.model),score:Number(r.mean_22),metrics:Object.fromEntries(Object.entries(r).filter(([k,v])=>typeof v==='number'&&!['rank','mean_22'].includes(k))) as Record<string,number>}));
 if(rows.length<3||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid mean scores');return rows;
 }};export default board;
