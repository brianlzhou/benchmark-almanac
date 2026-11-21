// Obfuscated-question accuracy is the challenge headline. Original-question accuracy is a metric.
import type {Leaderboard} from './types.ts';
import {fetchText,parseCsv} from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/jkhouja/lingoly-too/raw/main/leaderboard.csv';
const board:Leaderboard={benchmark:'lingoly-too',url:'https://huggingface.co/spaces/jkhouja/lingoly-too',feed:FEED,
 terms:'Public maker Space results; Hugging Face robots.txt permits this raw CSV path; no additional reading restriction stated.', stats:{baseline:{name:'Original question accuracy',unit:'%',better:'higher'}},
 async fetch(){
  const rows=parseCsv(await fetchText(FEED)).map(r=>({model:r.Model,score:Number(r['Obfuscated score'])*100,metrics:{baseline:Number(r['Baseline score'])*100}}));
  if(rows.length<3||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid CSV scores');return rows;
 }};export default board;
