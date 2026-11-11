// The authors' MetaAgent comparison reports task completion plus five judge dimensions.
// Task completion is the headline percentage. The other dimensions remain metrics.
// Transcribed and checked twice from the official README image on 2026-11-10.
// The linked Kaggle endpoint returns unrelated FailureSensorIQ tasks and is deliberately not used.
import type {Leaderboard} from './types.ts';
import {createHash} from 'node:crypto';
const IMAGE='https://github.com/user-attachments/assets/615059be-e296-40d3-90ec-97ee6cb00412';
const SHA='5b8959c26454116b4adb03b85a49625c7d17e2e9dad4d6607f4ca050d10eec9d';
const ROWS:[string,number,number,number,number,number,number][]=[
 ['gpt-4.1-2025-04-14',65,77,65,67,87,6],
 ['llama4-maverick-17b-128e-instruct-fp8',59,57,60,74,78,11],
 ['llama4-scout-17b-16e-instruct',48,55,49,73,68,33],
 ['llama-3-405b-instruct',44,50,42,66,57,42],
 ['mistral-large [snapshot unspecified]',40,54,43,77,71,35],
 ['llama-3-3-70b-instruct',40,47,35,84,72,43],
 ['granite-3-3-8b-instruct',35,43,37,58,66,30],
];
export default {benchmark:'assetopsbench',url:'https://github.com/IBM/AssetOpsBench',feed:IMAGE,
 terms:'IBM publishes this chart in its public AssetOpsBench README; the almanac credits IBM and links the source.',
 async fetch(){
  const response=await fetch(IMAGE,{headers:{'user-agent':'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`AssetOps chart HTTP ${response.status}`);
  if(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')!==SHA)throw new Error('AssetOps chart changed; fresh transcription required');
  return ROWS.map(([model,score,dataRetrievalAccuracy,resultVerification,actionSequence,clarityJustification,hallucinationRate])=>({model,score,harness:'MetaAgent',metrics:{dataRetrievalAccuracy,resultVerification,actionSequence,clarityJustification,hallucinationRate}}));
 }
} satisfies Leaderboard;
