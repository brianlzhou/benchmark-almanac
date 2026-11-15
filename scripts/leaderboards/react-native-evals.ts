// Published October 1, 2026 board snapshot. The current repository contains additional tasks.
// Decode Next.js strings as JSON data. Never run scripts.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {jsLiteral,nextFlight} from '../lib/html.ts';
const URL='https://rn-evals.vercel.app/';
const board:Leaderboard={benchmark:'react-native-evals',url:URL,feed:URL,
 terms:'Public Callstack results; robots.txt does not restrict this page.',
 async fetch(){const s=await fetchText(URL);const f=nextFlight(s);
 const mark=f.indexOf('"models":[{');if(mark<0)throw new Error('Model data missing');
 const models=jsLiteral<{id:string;label:string;solverModel:string;overallScorePct:number;tokensUsed:number;costUsd:number|null}[]>(f,f.indexOf('[',mark));
 if(models.length<3||models.some(m=>!Number.isFinite(m.overallScorePct)))throw new Error('Invalid overall scores');
 return models.map(m=>({model:m.solverModel.replace(/^vercel\/[^/]+\//,''),score:m.overallScorePct,setting:'2026-10-01; 10 runs',metrics:{tokens:m.tokensUsed,...(typeof m.costUsd==='number'?{totalCostUSD:m.costUsd}:{})}}));
 }};export default board;
