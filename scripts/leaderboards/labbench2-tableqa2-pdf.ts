// LABBench2 TableQA2 (PDF) tests question answering over scientific tables in PDF files.
// The headline is the leaderboard's average score across ten runs.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
const URL='https://advances.edisonscientific.com/benchmarks/labbench2/tableqa2-pdf/';
const board:Leaderboard={benchmark:'labbench2-tableqa2-pdf',url:URL,feed:URL,terms:'Public Edison Scientific leaderboard. Attribution and source licensing apply.',stats:{latency:{name:'Latency',unit:'seconds',better:'lower'}},async fetch(){const s=await fetchText(URL);const m=s.match(/const clientRows = (\[[\s\S]*?\]);/);if(!m)throw new Error('LABBench2 rows missing');const data=JSON.parse(m[1]);return data.map((r:any)=>({model:r.model,score:Number(r.primary_score)*100,setting:r.variant,metrics:{averageOutputTokens:r.average_output_tokens,averageDuration:r.average_duration}})) as LeaderboardRow[];}};export default board;
